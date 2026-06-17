const mongoose = require('mongoose');

const Cemetery = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'real' },
  location: {
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    }
  },
  address: String,
  city: String,
  country: String,
  description: String,
  image: String,
});

// Aggiungi indice geo-spaziale per le query di prossimità
Cemetery.index({ location: '2dsphere' });

module.exports = mongoose.model('Cemetery', Cemetery, "Cemeteries");