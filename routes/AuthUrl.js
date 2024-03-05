const express=require('express');
const router=express.Router();
const customMiddleware=require('../middlewares/customMidddleware');
// const auth=require('../middleware/auth');

const userController=require('../userApis/userApi');
router.post('/registerUser/',userController.registerUser);
router.get('/forGotPasswordOnUserId/',userController.forgotPasswordOnUserId);
router.post('/loginUser/',userController.loginUser);
router.post('/passWordResetVerification/',userController.passWordResetVerification);
router.post('/Auth/emailVerifyUser/',customMiddleware,userController.emailVerifyUser);
router.post('/Auth/updateUserEmail/',customMiddleware,userController.updateUserEmail);
router.post('/Auth/updateUserBasicData/',customMiddleware,userController.updateUserBasicData);
router.post('/Auth/roleAccess/AssignRoleToUser/',customMiddleware,userController.AssignRoleToUser);
// router.post('/login',userController.login);
// router.post('/updateUser/:id',auth,userController.updateUser)

module.exports=router;