// backend/models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  coverImage: { type: String }, // URL or path to the cover image
  isbn: { type: String, required: true, unique: true },
  publicationYear: { type: Number },
  genre: { type: String },
  copiesAvailable: { type: Number, default: 1 },
});

module.exports = mongoose.model('Book', bookSchema);
