// backend/routes/createDriver.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST: Create a Driver
router.post('/', async (req, res) => {
  const { userId, status } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }

  try {
    // 1️⃣ Check if user exists
    const userCheck = await pool.query(
      'SELECT * FROM "User" WHERE "UserID" = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2️⃣ Check if driver already exists for this user
    const driverCheck = await pool.query(
      'SELECT * FROM "Driver" WHERE "UserID" = $1',
      [userId]
    );
    if (driverCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Driver already exists for this user' });
    }

    // 3️⃣ Insert driver
    const insertDriver = await pool.query(
      `INSERT INTO "Driver" ("UserID", "status") 
       VALUES ($1, $2)
       RETURNING *`,
      [userId, status || 'pending']
    );

    res.status(201).json({ success: true, driver: insertDriver.rows[0] });
  } catch (err) {
    console.error('❌ Error creating driver:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
