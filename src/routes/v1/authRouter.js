const express = require('express');
const router = express.Router();

const { checkSession } = require("../../middlewares/identifyApplicationMiddlewares")
const { loginUser, createSession, logoutUser, registerUser } = require('../../controllers/v1/auth/userController');


router.post("/register",registerUser)
router.post('/login', loginUser);
router.get('/logout', checkSession, logoutUser);
// /auth/me does NOT use checkSession because the session-token cookie
// is an opaque OAuth2 refresh_token (not a JWT). createSession validates
// it by calling the OAuth2 server directly via oauth2Client.refreshAccessToken().
router.get("/me", createSession);

module.exports = router;