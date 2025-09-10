// backend/routes/UpdateDriverStatus.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Update driver status
router.put('/status', async (req, res) => {
  const { driverId, status } = req.body;

  if (!driverId || !status) {
    return res.status(400).json({ error: 'Driver ID and status are required' });
  }

  try {
    // Update driver status in the database
    const query = `
      UPDATE "Driver" 
      SET "status" = $1 
      WHERE "DriverID" = $2 
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, driverId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ 
      success: true, 
      message: `Driver status updated to ${status}`,
      driver: result.rows[0] 
    });
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get driver status
router.get('/status/:driverId', async (req, res) => {
  const { driverId } = req.params;

  try {
    const query = 'SELECT "status" FROM "Driver" WHERE "DriverID" = $1';
    const result = await pool.query(query, [driverId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ status: result.rows[0].status });
  } catch (error) {
    console.error('Error fetching driver status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;