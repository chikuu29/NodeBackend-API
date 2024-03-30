const express = require('express');
const router = express.Router();
const customMiddleware = require('../middleware/customMidddleware');
const authenticationController = require("../controller/auth/authentication")
// const auth=require('../middleware/auth');
const userController = require('../controller/auth/userApi');

const checkSessionMiddleware = require('../middleware/authenticate');
router.post('/register', customMiddleware, userController.registerUser);
router.get('/forGotPasswordOnUserId', customMiddleware, userController.forgotPasswordOnUserId);
router.post('/login', customMiddleware, userController.loginUser);
router.post('/logout', (req, res) => {
    // Assuming the cookie name is 'session'
    res.clearCookie('refresh_token', { httpOnly: true });
  
    // Send a response indicating successful logout
    res.status(200).send('Logged out successfully');
  });
router.post("/session",customMiddleware, checkSessionMiddleware,authenticationController.grantPermission)
router.get('/getNewAcessToken', customMiddleware, userController.getNewAcessToken);
router.post('/passWordResetVerification', customMiddleware, userController.passWordResetVerification);
router.post('/Auth/emailVerifyUser', customMiddleware, userController.emailVerifyUser);
router.post('/Auth/updateUserEmail', customMiddleware, userController.updateUserEmail);
router.post('/Auth/updateUserBasicData', customMiddleware, userController.updateUserBasicData);
router.post('/Auth/roleAccess/AssignRoleToUser', customMiddleware, userController.AssignRoleToUser);
// router.post('/login',userController.login);
// router.post('/updateUser/:id',auth,userController.updateUser)

module.exports = router;