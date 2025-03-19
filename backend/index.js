// backend/index.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/library', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/users', require('./routes/users'));
app.use('/books', require('./routes/books'));
app.use('/transactions', require('./routes/transactions')); // Critical line

// Test route to confirm server is working
app.get('/', (req, res) => res.send('Server is running'));

app.listen(5001, () => console.log('Server running on port 5001'));