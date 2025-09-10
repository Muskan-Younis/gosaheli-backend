const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create Passenger linked to an existing User
router.post('/', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }

  try {
    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM "User" WHERE "UserID" = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if passenger already exists
    const passengerCheck = await pool.query('SELECT * FROM "Passenger" WHERE "UserID" = $1', [userId]);
    if (passengerCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Passenger already exists for this user' });
    }

    // Insert new passenger
    const result = await pool.query(
      `INSERT INTO "Passenger" ("UserID") VALUES ($1) RETURNING *`,
      [userId]
    );

    res.status(201).json({ success: true, passenger: result.rows[0] });
  } catch (err) {
    console.error('Error creating passenger:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
