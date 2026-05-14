require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Cemetery = require('./Models/Cemetery');
const Deceased = require('./Models/Deceased');
const Employees = require('./Models/Employees');
const Municipalities = require('./Models/Municipalities');
const Tombstones = require('./Models/Tombstones');
const Users = require('./Models/Users');
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connesso a MongoDB'))
  .catch(err => console.error('❌ Errore MongoDB:', err));

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] Richiesta: ${req.method} ${req.url}`);
  next();
});

// Autenticazione
app.post('/api/users', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e password sono necessari' });
    }

    console.log('--- LOGIN ATTEMPT ---');
    console.log('Email ricevuta:', email);

    const normalizedEmail = email.trim().toLowerCase();
    const emailQuery = { email: { $regex: `^${normalizedEmail}$`, $options: 'i' } };
    let authUser = null;

    const employee = await Employees.findOne(emailQuery);
    console.log('Employee trovato:', employee?.email);
    console.log('passwordHash employee:', employee?.passwordHash);

    if (employee) {
      const valid = await bcrypt.compare(password, employee.passwordHash || '');
      console.log('Password employee valida:', valid);
      if (valid) {
        authUser = {
          role: 'employee',
          fullName: employee.fullName,
          email: employee.email,
          employeeId: employee._id,
          municipalityId: employee.municipalityId,
        };
      }
    }

    if (!authUser) {
      let user = await Users.findOne(emailQuery);
      if (!user) {
        user = await Users.findOne({ username: { $regex: `^${normalizedEmail}$`, $options: 'i' } });
      }
      console.log('User trovato:', user?.email);
      console.log('passwordHash user:', user?.passwordHash);

      if (user) {
        const valid = await bcrypt.compare(password, user.passwordHash || '');
        console.log('Password user valida:', valid);
        if (valid) {
          authUser = {
            role: 'user',
            username: user.fullName,
            email: user.email,
            userId: user._id,
            municipalityId: user.municipalityId,
            assignedDeceased: user.assignedDeceased || [],
          };
        }
      }
    }

    if (!authUser) {
      return res.status(401).json({ message: 'Email o password non validi' });
    }

    res.json(authUser);
  } catch (err) {
    console.error('Errore login:', err);
    res.status(500).json({ message: 'Errore interno durante il login' });
  }
});

// Ricerca defunti per nome
app.get('/api/Deceaseds/search', async (req, res) => {
  try {
    const name = req.query.name;
    if (!name) return res.status(400).json({ message: 'Nome richiesto' });
    
    const deceased = await Deceased.find({ 
      fullName: { $regex: name, $options: 'i' } 
    }).populate('assignedUsers');
    
    res.json(deceased);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/Deceaseds/:id', async (req, res) => {
  try {
    const deceased = await Deceased.findById(req.params.id).populate('assignedUsers');
    if (!deceased) {
      return res.status(404).json({ message: 'Defunto non trovato' });
    }
    res.json(deceased);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/Deceaseds/:id/memories', async (req, res) => {
  try {
    const { author, message, type } = req.body;

    if (!author || !message) {
      return res.status(400).json({ message: 'Autore e messaggio sono obbligatori' });
    }

    const deceased = await Deceased.findById(req.params.id);
    if (!deceased) {
      return res.status(404).json({ message: 'Defunto non trovato' });
    }

    const newMemory = {
      id: new mongoose.Types.ObjectId().toString(),
      deceasedId: deceased._id?.toString(),
      author: author.trim(),
      message: message.trim(),
      date: new Date(),
      type: ['memory', 'message', 'prayer'].includes(type) ? type : 'memory'
    };

    deceased.memories = [newMemory, ...(deceased.memories || [])].slice(0, 5);
    await deceased.save();

    res.status(201).json(deceased.memories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/Deceaseds/:id/memories/:memoryId', async (req, res) => {
  try {
    const deceased = await Deceased.findById(req.params.id);
    if (!deceased) {
      return res.status(404).json({ message: 'Defunto non trovato' });
    }

    deceased.memories = (deceased.memories || []).filter(m => m.id !== req.params.memoryId).slice(0, 5);
    await deceased.save();

    res.json(deceased.memories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Query per tutti i cimiteri
app.get('/api/Cemeteries', async (req, res) => {
  try {
    const cemeteries = await Cemetery.find();
    res.json(cemeteries);
  } catch (err) {
    console.error('Errore caricamento cimiteri:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/Cemeteries/:id', async (req, res) => {
  try {
    const cemetery = await Cemetery.findById(req.params.id);
    
    if (!cemetery) {
      return res.status(404).json({ message: 'Cimitero non trovato' });
    }

    res.json(cemetery);
  } catch (err) {
    console.error('Errore:', err);
    res.status(500).json({ message: err.message });
  }
});

// Ottieni defunti per cimitero
app.get('/api/Cemeteries/:id/Deceased', async (req, res) => {
  try {
    const cemeteryId = req.params.id;
    
    const cemetery = await Cemetery.findById(cemeteryId);
    if (!cemetery) {
      return res.status(404).json({ message: 'Cimitero non trovato' });
    }
    
    const tombstones = await Tombstones.find({ cemeteryId: cemeteryId });
    console.log(`Tombe trovate per cimitero ${cemeteryId}:`, tombstones.length);
    
    if (tombstones.length === 0) {
      return res.json([]);
    }
    
    const tombstoneIds = tombstones.map(t => t._id.toString());
    
    const deceased = await Deceased.find({ 
      graveId: { $in: tombstoneIds } 
    }).populate('assignedUsers');
    
    console.log(`Defunti trovati:`, deceased.length);
    
    const enrichedDeceased = deceased.map(defunto => {
      const tombstone = tombstones.find(t => t._id.toString() === defunto.graveId);
      return {
        ...defunto.toObject(),
        graveDetails: tombstone ? {
          section: tombstone.section,
          plotNumber: tombstone.plotNumber,
          coordinates: tombstone.coordinates,
          status: tombstone.status
        } : null
      };
    });
    
    res.json(enrichedDeceased);
  } catch (err) {
    console.error('Errore dettagliato:', err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

app.post('/api/Cemeteries', async (req, res) => {
  const cemetery = new Cemetery(req.body);
  try {
    const newCemetery = await cemetery.save();
    res.status(201).json(newCemetery);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server unico in ascolto su http://localhost:${PORT}`);
});