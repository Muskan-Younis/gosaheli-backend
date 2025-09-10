// backend/routes/drivers.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all drivers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Driver"');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get driver by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM "Driver" WHERE "DriverID" = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;