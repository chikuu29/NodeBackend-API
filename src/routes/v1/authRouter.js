const express = require('express');
const router = express.Router();

const { checkSession, extractBearerToken } = require("../../middlewares/identifyApplicationMiddlewares");
const { loginUser, registerUser } = require('../../controllers/v1/auth/userController');
const { createSession, refreshToken, logoutUser } = require('../../controllers/v1/auth/sessionController');

router.post("/register", registerUser);
router.post('/login', loginUser);
router.post('/logout', extractBearerToken, logoutUser);
router.get("/me", extractBearerToken, createSession);
router.get("/refresh", extractBearerToken, refreshToken);

module.exports = router;

