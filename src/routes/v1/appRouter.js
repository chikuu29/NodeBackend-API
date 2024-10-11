const express = require('express');
const router = express.Router();
const appController = require('../../controllers/app/appController');
const { authenticate } = require('../../middlewares/identifyApplicationMiddlewares');


router.get('/app-configuration',authenticate, appController.generateConfig)
router.get('/getNotification',authenticate,appController.getNotifiction)
router.get('/getDataBaseStatisics',authenticate,appController.getDataBaseStatisics)




module.exports = router;