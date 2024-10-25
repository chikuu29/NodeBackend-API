const express = require('express');
const router = express.Router();

const { checkSession } = require("../../middlewares/identifyApplicationMiddlewares")
const { loginUser, createSession, logoutUser } = require('../../controllers/v1/auth/userController');


router.post("/register",)
router.post('/login', loginUser);
router.get('/logout', checkSession, logoutUser);
router.get("/me", checkSession, createSession);

module.exports = router;