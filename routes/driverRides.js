const express = require("express");
const router = express.Router();
const pool = require("../db");

// 🚖 1. Get all open ride requests (drivers can see)
router.get("/open", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r."RequestID", u."Name" AS passenger, r."pickupLocation", r."dropoffLocation", r.fare
       FROM "RideRequests" r
       JOIN "Passenger" p ON r."PassengerID" = p."PassengerID"
       JOIN "User" u ON p."UserID" = u."UserID"
       WHERE r.status = 'pending'
       ORDER BY r."created_at" DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching open ride requests:", error);
    res.status(500).json({ success: false, message: "Error fetching open rides" });
  }
});

// 🚖 2. Driver accepts a ride request → creates Ride
router.post("/:requestId/accept", async (req, res) => {
  const { requestId } = req.params;
  const { driverId } = req.body;

  try {
    await pool.query("BEGIN");

    // Mark request as accepted
    const request = await pool.query(
      `UPDATE "RideRequests"
       SET status = 'accepted'
       WHERE "RequestID" = $1 AND status = 'pending'
       RETURNING *`,
      [requestId]
    );

    if (request.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Request not available" });
    }

    const reqData = request.rows[0];

    // Create Ride
    const ride = await pool.query(
      `INSERT INTO "Rides" ("RequestID", "PassengerID", "DriverID", "pickupLocation", "dropoffLocation", fare, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING *`,
      [reqData.RequestID, reqData.PassengerID, driverId, reqData.pickupLocation, reqData.dropoffLocation, reqData.fare]
    );

    await pool.query("COMMIT");
    res.json({ success: true, message: "Ride accepted", data: ride.rows[0] });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error accepting ride:", error);
    res.status(500).json({ success: false, message: "Error accepting ride" });
  }
});

// 🚖 3. Driver completes a ride
router.put("/:rideId/complete", async (req, res) => {
  const { rideId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE "Rides"
       SET status = 'completed', "updated_at" = CURRENT_TIMESTAMP
       WHERE "RideID" = $1 AND status = 'active'
       RETURNING *`,
      [rideId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ success: false, message: "Ride not found or already completed" });
    }

    res.json({ success: true, message: "Ride completed", data: result.rows[0] });
  } catch (error) {
    console.error("Error completing ride:", error);
    res.status(500).json({ success: false, message: "Error completing ride" });
  }
});
// 🚖 4. Driver rejects a ride request
router.post("/:requestId/reject", async (req, res) => {
  const { requestId } = req.params;
  try {
    const result = await pool.query(
      `UPDATE "RideRequests"
       SET status = 'rejected'
       WHERE "RequestID" = $1 AND status = 'pending'
       RETURNING *`,
      [requestId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ success: false, message: "Request not available" });
    }

    res.json({ success: true, message: "Ride request rejected", data: result.rows[0] });
  } catch (error) {
    console.error("Error rejecting ride:", error);
    res.status(500).json({ success: false, message: "Error rejecting ride" });
  }
});

module.exports = router;
