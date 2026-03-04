const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const { identifyApplication } = require('./middlewares/identifyApplicationMiddlewares');
const loggerMiddleware = require('./middlewares/loggerMiddleware');

// Initialize express app
const app = express();
const port = process.env.PORT || 7000;

// CORS — origins from .env (comma-separated), fallback to localhost
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173'];

const corsOption = {
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-ID', 'X-Device-ID', 'X-CSRFToken'],
};

// Middleware stack
app.use(loggerMiddleware);
app.use(cookieParser());
app.use(cors(corsOption));
app.use(identifyApplication);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/public/storage', express.static(path.join(__dirname, '../storage')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/index.html'));
});

// Routes
const oauthRoutesV1 = require('./routes/v1/oauthRouter');
const authRoutesV1 = require('./routes/v1/authRouter');
const appRoutesV1 = require('./routes/v1/appRouter');
const gymRoutersV1 = require('./routes/v1/gymRouter');

app.use('/v1/app', appRoutesV1);
app.use('/v1/auth', authRoutesV1);
app.use('/v1/oauth', oauthRoutesV1);
app.use('/v1/gym', gymRoutersV1);

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 SERVER RUNNING 🚀 AT PORT ${port}`);
});
