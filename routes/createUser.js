// backend/routes/createUser.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs'); // for hashing passwords

// Create a new user
router.post('/', async (req, res) => {
  const { username, email, password, phoneno } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'username, email, and password are required' });
  }

  try {
    // Check if email already exists
    const existingUser = await pool.query('SELECT * FROM "User" WHERE "email" = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert new user WITHOUT role column
    const result = await pool.query(
      'INSERT INTO "User" (email, username, password, phoneno) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, username, hashedPassword, phoneno]
    );

    console.log('🆕 User created:', result.rows[0]); // Helpful log on Windows CMD
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('❌ Error creating user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
