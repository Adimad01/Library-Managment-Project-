const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET: Fetch the current user's borrowed transactions (status 'borrowed')
router.get('/', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id, status: 'borrowed' })
      .populate('bookId', 'title author coverImage')
      .select('bookId borrowDate returnDate status');
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
});

// GET: Fetch all transactions (Admins only)
// This route will be accessible via GET /transactions/all
router.get('/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId', 'name email')
      .populate('bookId', 'title author coverImage')
      .select('userId bookId borrowDate returnDate status');
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching all transactions:', err);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
});

// POST: Borrow a Book – sets returnDate to one week from borrow date
router.post('/borrow', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);
    if (!book || book.copiesAvailable <= 0) {
      return res.status(400).json({ message: 'Book not available for borrowing' });
    }

    const borrowDate = new Date();
    const returnDate = new Date();
    returnDate.setDate(borrowDate.getDate() + 7); // Set return date 1 week later

    const newTransaction = new Transaction({
      userId: req.user.id,
      bookId,
      borrowDate,
      returnDate,
      status: 'borrowed'
    });

    await newTransaction.save();
    book.copiesAvailable -= 1;
    await book.save();

    res.status(201).json({ message: 'Book borrowed successfully', transaction: newTransaction });
  } catch (err) {
    console.error('Borrow error:', err);
    res.status(500).json({ message: 'Server error while borrowing book' });
  }
});

// POST: Return a Book
router.post('/return', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.body;
    const transaction = await Transaction.findOne({ userId: req.user.id, bookId, status: 'borrowed' });
    if (!transaction) {
      return res.status(400).json({ message: 'No active borrow transaction found for this book' });
    }

    transaction.status = 'returned';
    transaction.returnDate = new Date(); // Update returnDate to current date
    await transaction.save();

    const book = await Book.findById(bookId);
    if (book) {
      book.copiesAvailable += 1;
      await book.save();
    }

    res.json({ message: 'Book returned successfully', transaction });
  } catch (err) {
    console.error('Return error:', err);
    res.status(500).json({ message: 'Server error while returning book' });
  }
});

module.exports = router;
