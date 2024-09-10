const express = require('express');
const router = express.Router();
// const customMiddleware = require('../../middlewares/customMidddleware');
const {checkSession} = require("../../middlewares/identifyApplicationMiddlewares")
const { loginUser, createSession,logoutUser } = require('../../controllers/v1/auth/userController');

// const authenticationMiddleware = require('../../../middlewares/v1/authenticate');

// router.post('/register', userController.registerUser);
// router.get('/forGotPasswordOnUserId', customMiddleware, userController.forgotPasswordOnUserId);
router.post('/login', loginUser);
router.get('/logout', checkSession,logoutUser);
router.get("/me",checkSession, createSession);
// router.get('/refresh', authenticationMiddleware.checkSessionMiddleware, authenticationMiddleware.checkAccessTokenMiddleWare, authenticationController.newAccessToken);

// router.post('/passWordResetVerification', customMiddleware, userController.passWordResetVerification);
// router.post('/emailVerifyUser', customMiddleware, userController.emailVerifyUser);
// router.post('/updateUserEmail', customMiddleware, userController.updateUserEmail);
// router.post('/updateUserBasicData', customMiddleware, userController.updateUserBasicData);
// router.post('/roleAccess/AssignRoleToUser', customMiddleware, userController.AssignRoleToUser);

module.exports = router;