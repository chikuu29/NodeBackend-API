
const configLoader = require('../../configLoader');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { googleLogin } = require('../../controllers/v1/auth/userController');
// Google OAuth Strategy setup
const callbackURL = process.env.NODE_ENV === 'production'
    ? 'https://myomspanel.onrender.com/api/v1/oauth/google/callback'  // Production URL
    : 'http://localhost:5173/api/v1/oauth/google/callback';  // Development URL

passport.use(
    new GoogleStrategy(
        {
            clientID: configLoader.get('serverConfig')['OAUTH_LOGIN_SYSTEM']['GOOGLE_AUTH_CREDENTIALS']['client_id'],
            clientSecret: configLoader.get('serverConfig')['OAUTH_LOGIN_SYSTEM']['GOOGLE_AUTH_CREDENTIALS']['client_secret'],
            callbackURL: process.env.GOOGLE_OAUTH_CALLBACK_URL || callbackURL,
        },
        (accessToken, refreshToken, profile, done) => {
            // You can customize how user information from Google is handled here
            // For now, we're just passing the profile to the session
            return done(null, profile);
        }
    )
);

router.use(passport.initialize());


// Google Login Routes
// Step 1: Initiate Google Login
router.get(
    '/google',
    (req, res, next) => {
        const redirectTo = req.query.redirectTo || '/';
        // Store `redirectTo` in a session or pass as a query param
        // const callbackUrl = `/auth/google/callback?redirectTo=${encodeURIComponent(redirectTo)}`;
       
        // Proceed with Google authentication
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            session: false,
            state: JSON.stringify({ redirectTo })
        })(req, res, next);
    }

);

// Step 2: Google OAuth callback - Generate JWT on successful login
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
        session: false
    }),
    googleLogin
);
module.exports = router;