const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const customMiddleware = require('../../middlewares/customMidddleware');
const { checkSession } = require("../../middlewares/identifyApplicationMiddlewares")
const { loginUser, createSession, logoutUser, googleLogin } = require('../../controllers/v1/auth/userController');
const configLoader = require('../../configLoader');
console.log(configLoader.get('serverConfig')['OAUTH_LOGIN_SYSTEM']['GOOGLE_AUTH_CREDENTIALS']['client_id']);
console.log(configLoader.get('serverConfig')['OAUTH_LOGIN_SYSTEM']['GOOGLE_AUTH_CREDENTIALS']['client_secret']);


// Google OAuth Strategy setup
passport.use(
    new GoogleStrategy(
        {
            clientID: configLoader.get('serverConfig')['OAUTH_LOGIN_SYSTEM']['GOOGLE_AUTH_CREDENTIALS']['client_id'],
            clientSecret: configLoader.get('serverConfig')['OAUTH_LOGIN_SYSTEM']['GOOGLE_AUTH_CREDENTIALS']['client_secret'],
            callbackURL: 'https://nodebackend-api-1.onrender.com/v1/auth/google/callback',
        },
        (accessToken, refreshToken, profile, done) => {
            // You can customize how user information from Google is handled here
            // For now, we're just passing the profile to the session
            return done(null, profile);
        }
    )
);

// // Serialize and deserialize user to maintain session
// passport.serializeUser((user, done) => {
//     done(null, user);
// });

// passport.deserializeUser((user, done) => {
//     done(null, user);
// });

// Initialize Passport
router.use(passport.initialize());

router.post('/login', loginUser);
router.get('/logout', checkSession, logoutUser);
router.get("/me", checkSession, createSession);

// Google Login Routes
// Step 1: Initiate Google Login
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
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