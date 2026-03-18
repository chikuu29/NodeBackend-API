const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const { identifyApplication } = require('./middlewares/identifyApplicationMiddlewares');
const loggerMiddleware = require('./middlewares/loggerMiddleware');
const routes = require('./routes');

// Initialize express app
const app = express();

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
app.use('/api', routes);

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
