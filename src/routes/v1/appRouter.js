const express = require('express');
const router = express.Router();
const appController = require('../../controllers/app/appController');
const { authenticate } = require('../../middlewares/identifyApplicationMiddlewares');

router.get('/ui_template',appController.getTemplate)
router.get('/app-configuration',authenticate, appController.generateConfig)
router.get('/getNotification',authenticate,appController.getNotifiction)
router.get('/getDataBaseStatisics',authenticate,appController.getDataBaseStatisics)
router.post('/upload',authenticate,appController.uploadFile)



module.exports = router;