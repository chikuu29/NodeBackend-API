const express = require('express');
const router = express.Router();
// const customMiddleware = require('../../middlewares/customMidddleware');
const {checkSession} = require("../../middlewares/identifyApplicationMiddlewares")
const { loginUser, createSession } = require('../../controllers/v1/auth/userController');

// const authenticationMiddleware = require('../../../middlewares/v1/authenticate');

// router.post('/register', userController.registerUser);
// router.get('/forGotPasswordOnUserId', customMiddleware, userController.forgotPasswordOnUserId);
router.post('/login', loginUser);
// router.get('/logout', authenticationMiddleware.checkSessionMiddleware, (req, res) => {
//   // Assuming the cookie name is 'session'
//   res.clearCookie('refresh_token', {
//     httpOnly: true,
//     sameSite:'none',
//     httpOnly:true,
//     secure: true
//   });
//   const logoutRes={
//     "success":true,
//     "message":"Logged out successfully",
//     "logoutTime":new Date().toISOString()
//   }
//   return res.status(200).json(logoutRes);
//   // Send a response indicating successful logout
//   // res.status(200).send('Logged out successfully');
// });
router.get("/session",checkSession, createSession);
// router.get('/refresh', authenticationMiddleware.checkSessionMiddleware, authenticationMiddleware.checkAccessTokenMiddleWare, authenticationController.newAccessToken);

// router.post('/passWordResetVerification', customMiddleware, userController.passWordResetVerification);
// router.post('/emailVerifyUser', customMiddleware, userController.emailVerifyUser);
// router.post('/updateUserEmail', customMiddleware, userController.updateUserEmail);
// router.post('/updateUserBasicData', customMiddleware, userController.updateUserBasicData);
// router.post('/roleAccess/AssignRoleToUser', customMiddleware, userController.AssignRoleToUser);

module.exports = router;