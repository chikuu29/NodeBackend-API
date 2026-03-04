const express = require('express');
const router = express.Router();

const { checkSession, extractBearerToken } = require("../../middlewares/identifyApplicationMiddlewares")
const { loginUser, createSession, logoutUser, registerUser } = require('../../controllers/v1/auth/userController');


router.post("/register", registerUser)
router.post('/login', loginUser);
router.get('/logout', extractBearerToken, logoutUser);
router.get("/me", extractBearerToken, createSession);

module.exports = router;