const express = require("express");
const router = express.Router();
const pool = require("../db");

// 🚖 1. Passenger creates a ride request
router.post("/", async (req, res) => {
  const { passengerId, pickupLocation, dropoffLocation, fare } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO "RideRequests" ("PassengerID", "pickupLocation", "dropoffLocation", fare, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [passengerId, pickupLocation, dropoffLocation, fare]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error creating ride request:", error);
    res.status(500).json({ success: false, message: "Error creating ride request" });
  }
});

// 🚖 2. Passenger cancels their ride request
router.put("/:requestId/cancel", async (req, res) => {
  const { requestId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE "RideRequests"
       SET status = 'cancelled'
       WHERE "RequestID" = $1 AND status = 'pending'
       RETURNING *`,
      [requestId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ success: false, message: "Request not found or already processed" });
    }

    res.json({ success: true, message: "Ride request cancelled", data: result.rows[0] });
  } catch (error) {
    console.error("Error cancelling ride request:", error);
    res.status(500).json({ success: false, message: "Error cancelling ride request" });
  }
});

module.exports = router;
