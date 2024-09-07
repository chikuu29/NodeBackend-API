const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
// const MongoDBManager=require('./services/mongoService')
//Configure All Ther Services and Manager
// MongoDBManager.configure()

const corsOption = {
  origin: process.env.CORS_ORIGINS.split(','),
  credentials: true
};

const authRoutesV1 = require('./routes/v1/authRouter');
const appRoutesV1 = require('./routes/v1/AppRouter');
const app = express();
const port = process.env.PORT || 7000;
// Use middleware
app.use(cookieParser());
app.use(cors(corsOption));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));


// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

// Health check route
// app.get('/v1/check', (req, res) => {
//   const requestedDomain = req.hostname;
//   res.cookie('callback-url', requestedDomain, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
//     path: '/'
//   });
//   res.cookie('projectName', 'projectOne', {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
//     path: '/'
//   });
//   res.status(200).send('Application Is Healthy');
// });
// const apiKey = 'your-secret-api-key';

// app.use((req, res, next) => {
//     const key = req.headers['x-api-key'];

//     if (key === apiKey) {
//         next();
//     } else {
//         res.status(403).send('Forbidden');
//     }
// });


// Route handling

// app.use('/auth', AuthRoutes);


// REGISTER ALL ROUTER PRESENT IN THIS APPLICATION
app.use('/v1/app',appRoutesV1)
app.use('/v1/auth',authRoutesV1)








// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 SERVER RUNNING 🚀 AT PORT ${port}`);
});


