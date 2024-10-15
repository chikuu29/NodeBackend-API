const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const configLoader = require('./configLoader');
// const detectBrowser = require('./middlewares/detectBrowser');
const {identifyApplication}=require('./middlewares/identifyApplicationMiddlewares');
const loggerMiddleware = require('./middlewares/loggerMiddleware');
// Initialize express app
const app = express();
const port = configLoader.get('serverConfig').PORT || 7000;

// Define CORS options
// console.log("ALLOW ORIGIN",process.env.CORS_ORIGINS.split(','));
// console.log("hii",configLoader.get('serverConfig').ALLOW_HEADERS);

const corsOption = {
  origin: ['https://myomspanel.onrender.com','http://localhost:5173/'],
  credentials: true,
  allowedHeaders: configLoader.get('serverConfig').ALLOW_HEADERS || ['Content-Type', 'Authorization']
};

// Apply the detectBrowser middleware globally
// app.use(detectBrowser);


// Use middleware
// Use the logger middleware for all incoming requests
// app.use(passport.session());


app.use(loggerMiddleware);
app.use(cookieParser());
app.use(cors(corsOption));
app.use(identifyApplication)
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

// Import routes
const authRoutesV1 = require('./routes/v1/authRouter');
const appRoutesV1 = require('./routes/v1/appRouter');

// Register routes
app.use('/v1/app', appRoutesV1);
app.use('/v1/auth', authRoutesV1);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 SERVER RUNNING 🚀 AT PORT ${port}`);
});


