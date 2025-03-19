const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Borrow a book
router.post('/', authenticateToken, async (req, res) => {
  const { bookId } = req.body;
  try {
    const book = await Book.findById(bookId);
    if (!book || book.copiesAvailable <= 0) {
      return res.status(400).json({ message: 'Book not available' });
    }
    const user = await User.findById(req.user.id);
    user.borrowedBooks.push(bookId);
    await user.save();
    book.copiesAvailable -= 1;
    await book.save();
    const transaction = new Transaction({ userId: req.user.id, bookId });
    await transaction.save();
    res.status(200).json({ message: 'Book borrowed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Return a book
router.post('/return', authenticateToken, async (req, res) => {
  const { bookId } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const index = user.borrowedBooks.indexOf(bookId);
    if (index === -1) {
      return res.status(400).json({ message: 'Book not borrowed by user' });
    }
    user.borrowedBooks.splice(index, 1);
    await user.save();
    const book = await Book.findById(bookId);
    book.copiesAvailable += 1;
    await book.save();
    const transaction = await Transaction.findOne({ userId: req.user.id, bookId, status: 'borrowed' });
    transaction.status = 'returned';
    transaction.returnDate = Date.now();
    await transaction.save();
    res.status(200).json({ message: 'Book returned' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;