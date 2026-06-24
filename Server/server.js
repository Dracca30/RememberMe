require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Cemetery = require('./Models/Cemetery');
const Deceased = require('./Models/Deceased');
const Employees = require('./Models/Employees');
const Tombstones = require('./Models/Tombstones');
const Users = require('./Models/Users');

const app = express();
app.use(cors({
  origin: [
    "https://remember-me-ycog.vercel.app",
    "http://localhost:4200",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // ✅ limit per le foto base64

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log('✅ Connesso a MongoDB');
}

// Middleware che connette prima di ogni richiesta
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ Errore MongoDB:', err);
    res.status(500).json({
      message: 'Errore connessione database'
    });
  }
});

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════

app.post('/api/users', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(401).json({ message: 'Email o password non validi' });

    const normalizedEmail = email.trim().toLowerCase();
    const emailQuery = { email: { $regex: `^${normalizedEmail}$`, $options: 'i' } };
    let authUser = null;

    const employee = await Employees.findOne(emailQuery);
    if (employee) {
      const valid = await bcrypt.compare(password, employee.passwordHash || '');
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

    let user = null;
    if (!authUser) {
      user = await Users.findOne(emailQuery);

      const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
      if (user) {
        if (requireVerification && !user.emailVerified)
          return res.status(403).json({ message: 'Email non verificata. Controlla la tua casella di posta e conferma l\'autenticazione account.' });

        const valid = await bcrypt.compare(password, user.passwordHash || '');
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

    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
    if (requireVerification && user && !user.emailVerified)
      return res.status(403).json({ message: 'Email non verificata. Controlla la tua casella di posta e conferma l\'autenticazione account.' });

    if (!authUser)
      return res.status(401).json({ message: 'Email o password non validi' });

    res.json(authUser);
  } catch (err) {
    console.error('Errore login:', err);
    res.status(500).json({ message: 'Errore interno durante il login' });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const { username, fullName, email, password, municipalityId, createdBy } = req.body;
    if (!username || !fullName || !email || !password)
      return res.status(400).json({ message: 'Dati di registrazione incompleti' });

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await Users.findOne({ email: { $regex: `^${normalizedEmail}$`, $options: 'i' } });
    if (existing)
      return res.status(409).json({ message: 'Impossibile completare la registrazione' });

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const user = new Users({
      username: username.trim(),
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      municipalityId: municipalityId || null,
      createdBy: createdBy || 'SELF',
      emailVerified: false,
      verificationToken,
      assignedDeceased: []
    });

    const saved = await user.save();

    // Il token viene restituito al client che invierà la mail via EmailJS
    res.status(201).json({
      _id: saved._id,
      username: saved.username,
      fullName: saved.fullName,
      email: saved.email,
      municipalityId: saved.municipalityId,
      verificationToken: saved.verificationToken,
      message: 'Registrazione completata. Controlla la posta per confermare il tuo account.'
    });
  } catch (err) {
    console.error('Errore registrazione:', err);
    res.status(500).json({ message: 'Errore interno durante la registrazione' });
  }
});

app.get('/api/users/verify/:token', async (req, res) => {
  try {
    const token = req.params.token;
    if (!token) return res.status(400).json({ message: 'Token di verifica mancante' });

    const user = await Users.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: 'Token non valido o scaduto' });

    user.emailVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({ message: 'Email verificata con successo. Ora puoi accedere.' });
  } catch (err) {
    console.error('Errore verifica email:', err);
    res.status(500).json({ message: 'Errore interno durante la verifica' });
  }
});

app.post('/api/users/resend-verification', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email richiesta' });

    const user = await Users.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
    if (user && !user.emailVerified) {
      const verificationToken = crypto.randomBytes(24).toString('hex');
      user.verificationToken = verificationToken;
      await user.save();

      // Restituisce il token al client che invierà la mail via EmailJS
      return res.json({
        message: 'Token di verifica generato.',
        verificationToken,
        fullName: user.fullName || user.username,
        email: user.email
      });
    }

    // Per privacy, rispondi ok anche se l'email non esiste
    res.json({ message: 'Se l\'email è registrata e non ancora verificata, il link di verifica è stato reinviato.' });
  } catch (err) {
    console.error('Errore reinvio email verifica:', err);
    res.status(500).json({ message: 'Errore interno' });
  }
});

app.post('/api/users/forgot', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email richiesta' });

    const user = await Users.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });

    if (user) {
      const resetToken = crypto.randomBytes(24).toString('hex');
      user.resetToken = resetToken;
      user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 ora
      await user.save();

      // Restituisce il token al client che invierà la mail via EmailJS
      return res.json({
        message: 'Token di reset generato.',
        resetToken,
        fullName: user.fullName || user.username,
        email: user.email
      });
    }

    // Per privacy, rispondi ok anche se l'email non esiste
    res.json({ message: 'Se l\'email è registrata, sono state inviate istruzioni.' });
  } catch (err) {
    console.error('Errore forgot password:', err);
    res.status(500).json({ message: 'Errore interno' });
  }
});

// Validazione token di reset password
app.get('/api/users/reset-password/:token', async (req, res) => {
  try {
    const token = req.params.token;
    if (!token) return res.status(400).json({ message: 'Token mancante' });

    const user = await Users.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: 'Token non valido o scaduto' });

    res.json({ message: 'Token valido', email: user.email });
  } catch (err) {
    console.error('Errore validazione reset token:', err);
    res.status(500).json({ message: 'Errore interno' });
  }
});

// Reset password con token
app.post('/api/users/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ message: 'Token e nuova password sono richiesti' });

    const user = await Users.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: 'Token non valido o scaduto' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password aggiornata con successo.' });
  } catch (err) {
    console.error('Errore reset password:', err);
    res.status(500).json({ message: 'Errore interno' });
  }
});

// Cambia password da loggato (per user o employee)
app.post('/api/users/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, role } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Dati incompleti' });
    }

    let account = null;
    if (role === 'employee') {
      account = await Employees.findById(userId);
    } else {
      account = await Users.findById(userId);
    }

    if (!account) {
      account = await Users.findById(userId) || await Employees.findById(userId);
    }

    if (!account) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }

    const valid = await bcrypt.compare(currentPassword, account.passwordHash || '');
    if (!valid) {
      return res.status(401).json({ message: 'Password attuale non valida' });
    }

    account.passwordHash = await bcrypt.hash(newPassword, 10);
    await account.save();
    res.json({ message: 'Password cambiata con successo' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ottieni preferiti
app.get('/api/users/:userId/favorites', async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId).populate('favorites');
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });
    res.json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Aggiungi a preferiti
app.post('/api/users/:userId/favorites', async (req, res) => {
  try {
    const { deceasedId } = req.body;
    if (!deceasedId) return res.status(400).json({ message: 'ID defunto richiesto' });
    const user = await Users.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });

    if (!user.favorites) {
      user.favorites = [];
    }

    if (!user.favorites.some(id => id.toString() === deceasedId)) {
      user.favorites.push(deceasedId);
      await user.save();
    }
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rimuovi dai preferiti
app.delete('/api/users/:userId/favorites/:deceasedId', async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });

    if (user.favorites) {
      user.favorites = user.favorites.filter(id => id.toString() !== req.params.deceasedId);
      await user.save();
    }
    res.json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ════════════════════════════════════════════════════════
//  USERS
// ════════════════════════════════════════════════════════

// Lista tutti gli user (per employee)
app.get('/api/users', async (req, res) => {
  try {
    const users = await Users.find({}, 'username email municipalityId');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Defunti assegnati a uno user
app.get('/api/users/:userId/deceased', async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId);
    const userDeceasedIds = user ? user.assignedDeceased || [] : [];
    
    const deceased = await Deceased.find({
      $or: [
        { assignedUsers: new mongoose.Types.ObjectId(req.params.userId) },
        { _id: { $in: userDeceasedIds } }
      ]
    });
    res.json(deceased);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ════════════════════════════════════════════════════════
//  CIMITERI
// ════════════════════════════════════════════════════════

app.get('/api/Cemeteries', async (req, res) => {
  try {
    const cemeteries = await Cemetery.find();
    res.json(cemeteries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/Cemeteries/:id', async (req, res) => {
  try {
    const cemetery = await Cemetery.findById(req.params.id);
    if (!cemetery) return res.status(404).json({ message: 'Cimitero non trovato' });
    res.json(cemetery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/Cemeteries', async (req, res) => {
  try {
    const cemetery = new Cemetery(req.body);
    const saved = await cemetery.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Defunti per cimitero
app.get('/api/Cemeteries/:id/Deceased', async (req, res) => {
  try {
    const cemetery = await Cemetery.findById(req.params.id);
    if (!cemetery) return res.status(404).json({ message: 'Cimitero non trovato' });

    const tombstones = await Tombstones.find({ cemeteryId: req.params.id });
    if (tombstones.length === 0) return res.json([]);

    const tombstoneIds = tombstones.map(t => t._id.toString());
    const deceased = await Deceased.find({ graveId: { $in: tombstoneIds } }).populate('assignedUsers');

    const enriched = deceased.map(d => {
      const tombstone = tombstones.find(t => t._id.toString() === d.graveId);
      return {
        ...d.toObject(),
        graveDetails: tombstone ? {
          section: tombstone.section,
          plotNumber: tombstone.plotNumber,
          coordinates: tombstone.coordinates,
          status: tombstone.status
        } : null
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ════════════════════════════════════════════════════════
//  DECEASED
// ════════════════════════════════════════════════════════

// ⚠️ /search PRIMA di /:id altrimenti Express legge "search" come un id
app.get('/api/Deceaseds', async (req, res) => {
  try {
    const filter = {};
    const deceased = await Deceased.find(filter).populate('assignedUsers', 'email fullName');
    res.json(deceased);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/Deceaseds/:id', async (req, res) => {
  try {
    const update = {};
    const allowed = ['fullName', 'birthDate', 'deathDate', 'biography', 'story', 'graveId', 'deceasedImage', 'epitaph'];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'epitaph') {
          update.biography = req.body.epitaph;
        } else {
          update[field] = req.body[field];
        }
      }
    });

    const deceased = await Deceased.findByIdAndUpdate(req.params.id, update, { new: true }).populate('assignedUsers', 'email fullName');
    if (!deceased) return res.status(404).json({ message: 'Defunto non trovato' });
    res.json(deceased);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/Deceaseds/:id', async (req, res) => {
  try {
    const deceased = await Deceased.findByIdAndDelete(req.params.id);
    if (!deceased) return res.status(404).json({ message: 'Defunto non trovato' });

    if (deceased.assignedUsers && deceased.assignedUsers.length) {
      await Users.updateMany(
        { _id: { $in: deceased.assignedUsers } },
        { $pull: { assignedDeceased: deceased._id } }
      );
    }

    res.json({ message: 'Defunto eliminato' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/Deceaseds/:id/assign', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email richiesta' });

    const user = await Users.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });

    const deceased = await Deceased.findById(req.params.id);
    if (!deceased) return res.status(404).json({ message: 'Defunto non trovato' });

    const userId = user._id;
    if (!deceased.assignedUsers.some((id) => id.equals(userId))) {
      deceased.assignedUsers.push(userId);
      await deceased.save();
    }

    if (!user.assignedDeceased.some((id) => id.equals(deceased._id))) {
      user.assignedDeceased.push(deceased._id);
      await user.save();
    }

    const updated = await Deceased.findById(req.params.id).populate('assignedUsers', 'email fullName');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/Deceaseds/:id/unassign', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email richiesta' });

    const user = await Users.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });

    const deceased = await Deceased.findById(req.params.id);
    if (!deceased) return res.status(404).json({ message: 'Defunto non trovato' });

    deceased.assignedUsers = deceased.assignedUsers.filter((id) => !id.equals(user._id));
    await deceased.save();

    user.assignedDeceased = user.assignedDeceased.filter((id) => !id.equals(deceased._id));
    await user.save();

    const updated = await Deceased.findById(req.params.id).populate('assignedUsers', 'email fullName');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/Deceaseds/search', async (req, res) => {
  try {
    const name = req.query.name;
    if (!name) return res.status(400).json({ message: 'Nome richiesto' });
    const deceased = await Deceased.find({
      fullName: { $regex: name, $options: 'i' }
    }).populate('assignedUsers');

    // Enrichisci con cemeteryId e graveDetails
    const enriched = await Promise.all(deceased.map(async (d) => {
      if (d.graveId) {
        const tombstone = await Tombstones.findById(d.graveId);
        if (tombstone) {
          return {
            ...d.toObject(),
            cemeteryId: tombstone.cemeteryId,
            graveDetails: {
              section: tombstone.section,
              plotNumber: tombstone.plotNumber,
              coordinates: tombstone.coordinates,
              status: tombstone.status
            }
          };
        }
      }
      return d.toObject();
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/Deceaseds/:id', async (req, res) => {
  try {
    const deceased = await Deceased.findById(req.params.id).populate('assignedUsers');
    if (!deceased) return res.status(404).json({ message: 'Defunto non trovato' });
    res.json(deceased);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/Deceaseds', async (req, res) => {
  try {
    const { fullName, birthDate, deathDate, deceasedImage, assignedUsers } = req.body;
    if (!fullName || !birthDate || !deathDate)
      return res.status(400).json({ message: 'Nome, data nascita e data morte sono obbligatori' });

    const deceased = new Deceased({
      fullName, birthDate, deathDate,
      deceasedImage: deceasedImage || '',
      assignedUsers: assignedUsers || [],
      images: [],
      memories: [],
    });
    const saved = await deceased.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/Deceaseds/:id/story', async (req, res) => {
  try {
    const deceased = await Deceased.findByIdAndUpdate(
      req.params.id, { $set: { story: req.body.story } }, { new: true }
    );
    if (!deceased) return res.status(404).json({ message: 'Defunto non trovato' });
    res.json(deceased);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/Deceaseds/:id/epitaph', async (req, res) => {
  try {
    const deceased = await Deceased.findByIdAndUpdate(
      req.params.id, { $set: { biography: req.body.epitaph } }, { new: true }
    );
    if (!deceased) return res.status(404).json({ message: 'Defunto non trovato' });
    res.json(deceased);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/Deceaseds/:id/photos', async (req, res) => {
  try {
    const deceased = await Deceased.findByIdAndUpdate(
      req.params.id, { $push: { images: req.body.photo } }, { new: true }
    );
    if (!deceased) return res.status(404).json({ message: 'Defunto non trovato' });
    res.json(deceased.images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/Deceaseds/:id/photos/:index', async (req, res) => {
  try {
    const deceased = await Deceased.findById(req.params.id);
    if (!deceased) return res.status(404).json({ message: 'Defunto non trovato' });
    deceased.images.splice(Number(req.params.index), 1);
    await deceased.save();
    res.json(deceased.images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/Deceaseds/:id/memories', async (req, res) => {
  try {
    const { author, message, type } = req.body;
    if (!author || !message)
      return res.status(400).json({ message: 'Autore e messaggio sono obbligatori' });

    const deceased = await Deceased.findById(req.params.id);
    if (!deceased) return res.status(404).json({ message: 'Defunto non trovato' });

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
    if (!deceased) return res.status(404).json({ message: 'Defunto non trovato' });
    deceased.memories = (deceased.memories || []).filter(m => m.id !== req.params.memoryId);
    await deceased.save();
    res.json(deceased.memories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ════════════════════════════════════════════════════════
//  START
// ════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server in ascolto su http://localhost:${PORT}`);
});