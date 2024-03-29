const express = require('express');
const router = express.Router();
const customMiddleware = require('../middleware/customMidddleware');
// const auth=require('../middleware/auth');

const userController = require('../controller/auth/userApi');
router.post('/register', customMiddleware, userController.registerUser);
router.get('/forGotPasswordOnUserId', customMiddleware, userController.forgotPasswordOnUserId);
router.post('/login', customMiddleware, userController.loginUser);
router.get("/session", (req, res) => {
    const cookieData = req.cookies;

    // Output cookie data
    console.log('Cookie Data:', cookieData);
    return res.json({ "Hi": "chiku" })
})
router.get('/getNewAcessToken', customMiddleware, userController.getNewAcessToken);
router.post('/passWordResetVerification', customMiddleware, userController.passWordResetVerification);
router.post('/Auth/emailVerifyUser', customMiddleware, userController.emailVerifyUser);
router.post('/Auth/updateUserEmail', customMiddleware, userController.updateUserEmail);
router.post('/Auth/updateUserBasicData', customMiddleware, userController.updateUserBasicData);
router.post('/Auth/roleAccess/AssignRoleToUser', customMiddleware, userController.AssignRoleToUser);
// router.post('/login',userController.login);
// router.post('/updateUser/:id',auth,userController.updateUser)

module.exports = router;