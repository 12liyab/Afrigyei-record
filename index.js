const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors({ origin: ['https://afrigyei-testing-station.vercel.app', 'http://localhost:3000'] })); // Update with your Vercel front-end URL

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Record Schema
const recordSchema = new mongoose.Schema({
  vehicleNumber: String,
  ownerName: String,
  phoneNumber: String,
  vehicleType: String,
  expiryDate: Date,
  status: String,
  createdAt: { type: Date, default: Date.now },
  createdBy: String
});
const Record = mongoose.model('Record', recordSchema);

// Hash password function
const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

// Routes
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length !== 4 || !/^\d{4}$/.test(password)) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const user = new User({ username, passwordHash: hashPassword(password) });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length !== 4) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }
  try {
    const user = await User.findOne({ username });
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add other routes (e.g., /api/records) as needed

module.exports = app; // Export for Vercel serverless
