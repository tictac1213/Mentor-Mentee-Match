import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import db from '../config/db.js'


const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Check if user exists
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, email, role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, userId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, userId: user.user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router