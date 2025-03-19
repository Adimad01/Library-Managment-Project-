const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET route for registration page
router.get('/register', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>User Registration</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        form { max-width: 300px; margin: 0 auto; }
        input, select { width: 100%; margin-bottom: 10px; padding: 8px; }
        button { padding: 10px; background-color: #4CAF50; color: white; border: none; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>Register</h1>
      <form method="POST" action="/users/register">
        <input type="text" name="name" placeholder="Name" required /><br/>
        <input type="email" name="email" placeholder="Email" required /><br/>
        <input type="password" name="password" placeholder="Password" required /><br/>
        <select name="role">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select><br/>
        <button type="submit">Register</button>
      </form>
    </body>
    </html>
  `);
});

// POST route to register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user'
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error registering user:', err);
    if (err.code === 11000) {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Error registering user', error: err.message });
    }
  }
});

// POST route to login a user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Debug: Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined. Please check your .env file.');
      throw new Error('JWT_SECRET is not defined');
    }
    // Optionally, log the secret (remove this in production)
    console.log('JWT_SECRET:', process.env.JWT_SECRET);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(200).json({ accessToken: token });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});


// GET route to fetch the current user (protected)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('borrowedBooks'); // Ensure this line exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// Update user profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, categories } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone, categories },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get all users (Admins only)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'name email'); // Fetch only name and email
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

module.exports = router;
