const express = require('express');
const router = express.Router();

const { checkSession } = require("../../middlewares/identifyApplicationMiddlewares")
const { loginUser, createSession, logoutUser, registerUser } = require('../../controllers/v1/auth/userController');


router.post("/register",registerUser)
router.post('/login', loginUser);
router.get('/logout', checkSession, logoutUser);
router.get("/me", checkSession, createSession);

module.exports = router;