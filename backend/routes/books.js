// backend/routes/books.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Book = require('../models/Book');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all books
router.get('/', authenticateToken, async (req, res) => {
  try {
    const books = await Book.find(); // Fetch all books from the database
    res.json(books);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ message: 'Server error while fetching books' });
  }
});

// Get a book by ID
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid book ID' });

  try {
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: 'Server error while fetching book' });
  }
});

// Add a new book (with image upload)
router.post('/', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, author, isbn } = req.body;
    if (!title || !author || !isbn) return res.status(400).json({ message: 'Title, author, and ISBN are required' });

    const book = new Book({
      title,
      author,
      isbn,
      image: req.file ? `uploads/${req.file.filename}` : null
    });

    const newBook = await book.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to add book' });
  }
});

// Update a book
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid book ID' });

  try {
    const updatedBook = await Book.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedBook) return res.status(404).json({ message: 'Book not found' });
    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update book' });
  }
});

// DELETE: Delete a book (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Validate the id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid book ID' });
    }
    const book = await Book.findByIdAndDelete(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ message: 'Server error while deleting book' });
  }
});
module.exports = router;
