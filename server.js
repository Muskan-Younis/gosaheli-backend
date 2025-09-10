// ==========================
// server.js
// ==========================
const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const cors = require('cors');

// Database pool
const pool = require('./db');

// ==========================
// MIDDLEWARE
// ==========================
app.use(cors({ origin: '*' }));
app.use(express.json());

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/Vehicle_Images', express.static(path.join(__dirname, 'Vehicle_Images')));
app.use('/License_Images', express.static(path.join(__dirname, 'License_Images')));

// ==========================
// MULTER CONFIG
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// ==========================
// IMPORT ROUTES
// ==========================
const driversRoutes = require('./routes/drivers');
const updateDriverStatusRoutes = require('./routes/UpdateDriverStatus');
const notificationPassengerRoutes = require('./routes/NotificationPassenger');
const saheliFeedbackRoutes = require('./routes/saheliFeedback');
const driverRidesRoutes = require('./routes/driverRides');
const rideRequestsRoutes = require('./routes/rideRequests');
const profileUpdationRoutes = require('./routes/ProfileUpdation');
const changePasswordRoute = require('./routes/ChangeThePassword');
const feedbackRoute = require('./routes/feedback');
const notificationsRouter = require('./routes/notifications');
const complaintsRoutes = require('./routes/complaints');
const favouritesRoutes = require('./routes/favourites');
const favouriteDetailsRouter = require('./routes/favouriteDetails');
const becomePassengerRoute = require('./routes/becomePassenger');
const resetRoutes = require('./routes/reset');
const getPassengerByUserId = require('./routes/getPassengerByUserId');
const becomeDriverRoute = require('./routes/becomeDriver');
const driverCarpoolRoutes = require('./routes/DriverCarpool');
const carpoolRoutes = require('./routes/carpool');
const acceptedPassengerRoutes = require('./routes/AcceptedPassengerCarpools');
const uploadVehicleImage = require('./routes/uploadVehicleImage');
const uploadLicense = require('./routes/uploadLicense');
const deleteLicenseImage = require('./routes/deleteLicenseImage');
const vehicleDetailsRoutes = require('./routes/vehicleDetails');
const createDriver = require('./routes/createDriver');
const createUser = require('./routes/createUser');
const createPassenger = require('./routes/createPassenger');

// ==========================
// ROOT & TEST ROUTE
// ==========================
app.get('/', (req, res) => {
  res.send('GOSAHELI Backend Server is Running!');
});

// ==========================
// ROUTES
// ==========================

// Drivers
app.use('/api/drivers', driversRoutes);
app.use('/api/driver', updateDriverStatusRoutes);
app.use('/api/driver/rides', driverRidesRoutes);
app.use('/api/driver/carpool', driverCarpoolRoutes);

// Notifications
app.use('/api/notification', notificationPassengerRoutes);
app.use('/api/notifications', notificationsRouter);

// user stuff
app.use('/api/create-driver', createDriver);
app.use('/api/create-user', createUser);

app.use('/api/create-passenger', createPassenger);

// Feedback
app.use('/api/feedback', feedbackRoute);
app.use('/api/saheli-feedback', saheliFeedbackRoutes);

// Ride requests
app.use('/api/ride-requests', rideRequestsRoutes);

// Profile
app.use('/api/profile', profileUpdationRoutes);
app.use('/api/change-password', changePasswordRoute);

// Complaints
app.use('/api/complaints', complaintsRoutes);

// Favourites
app.use('/api/favourites', favouritesRoutes);
app.use('/api/favourites-details', favouriteDetailsRouter);

// Passenger
app.use('/api/become-passenger', becomePassengerRoute);
app.use('/api/get-passenger', getPassengerByUserId);

// Driver
app.use('/api/become-driver', becomeDriverRoute);

// Carpools
app.use('/api/carpool', carpoolRoutes);
app.use('/api/accepted-carpool', acceptedPassengerRoutes);

// Vehicle & License uploads
app.use('/api/upload-vehicle', uploadVehicleImage);
app.use('/api/upload-license', uploadLicense);
app.use('/api/delete-license', deleteLicenseImage);

// Vehicle details
app.use('/api/vehicle-details', vehicleDetailsRoutes);

// Reset
app.use('/api/reset', resetRoutes);

// ==========================
// FARE RATE
// ==========================
// Update fare rate
app.put('/api/fare-rate', async (req, res) => {
  const { fareRate } = req.body;
  try {
    const check = await pool.query('SELECT * FROM fare_settings WHERE id = 1');
    if (check.rows.length > 0) {
      await pool.query(
        'UPDATE fare_settings SET rate_per_km = $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
        [fareRate]
      );
    } else {
      await pool.query(
        'INSERT INTO fare_settings (id, rate_per_km) VALUES (1, $1)',
        [fareRate]
      );
    }
    res.json({ success: true, message: 'Fare rate updated successfully' });
  } catch (error) {
    console.error('Error updating fare rate:', error);
    res.status(500).json({ success: false, message: 'Failed to update fare rate' });
  }
});

// Get current fare rate
app.get('/api/fare-rate', async (req, res) => {
  try {
    const result = await pool.query('SELECT rate_per_km FROM fare_settings WHERE id = 1');
    res.json({ success: true, fareRate: result.rows[0]?.rate_per_km || 50 });
  } catch (error) {
    console.error('Error fetching fare rate:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch fare rate' });
  }
});



// ==========================
// USER ROUTES
// ==========================

// Check if email or phone exists
app.post('/api/user/check-exists', async (req, res) => {
  const { email, phoneNo } = req.body;
  try {
    const emailResult = await pool.query('SELECT 1 FROM "User" WHERE email = $1 LIMIT 1', [email]);
    const phoneResult = await pool.query('SELECT 1 FROM "User" WHERE phoneno = $1 LIMIT 1', [phoneNo]);
    res.json({
      emailExists: emailResult.rows.length > 0,
      phoneExists: phoneResult.rows.length > 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register
app.post('/api/user', async (req, res) => {
  const { email, username, password, phoneNo } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO "User" (email, username, password, phoneNo) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, username, hashedPassword, phoneNo]
    );
    res.status(201).json({ message: 'User registered', user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ message: 'Email or Phone number already exists' });
    } else {
      res.status(500).json({ message: 'Registration failed' });
    }
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      success: true,
      user: {
        UserID: user.UserID,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by email
app.get('/api/user', async (req, res) => {
  const { email } = req.query;
  try {
    const result = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Fetch error' });
  }
});

// Get user by ID
app.get('/api/user-by-id/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT "UserID","username","email","photo_url","last_role" FROM "User" WHERE "UserID" = $1',
      [userId]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile photo
app.post('/api/upload-profile-photo', upload.single('photo'), async (req, res) => {
  const { userId } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  const photoUrl = `/uploads/${file.filename}`;
  try {
    await pool.query('UPDATE "User" SET photo_url = $1 WHERE "UserID" = $2', [photoUrl, userId]);
    res.json({ success: true, photo_url: photoUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload error' });
  }
});

// Ride history
app.get('/api/ride-history/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM ride_History WHERE "UserID" = $1 ORDER BY ride_date DESC', [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch ride history' });
  }
});

// Forgot/Update password
app.put('/api/update-password', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE "User" SET password = $1 WHERE email = $2', [hashedPassword, email]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Update error' });
  }
});

// ==========================
// GLOBAL ERROR HANDLER
// ==========================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// ==========================
// START SERVER
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
