const express = require('express');
const router = express.Router();
const appController = require('./app.controller');
const { authenticate, extractBearerToken } = require('../../middlewares/identifyApplicationMiddlewares');

router.get('/ui_template', extractBearerToken, authenticate, appController.getTemplate)
router.get('/app-configuration', extractBearerToken, authenticate, appController.generateConfig)
router.get('/getNotification', extractBearerToken, authenticate, appController.getNotifiction)
router.get('/getDataBaseStatisics', extractBearerToken, authenticate, appController.getDataBaseStatisics)
router.post('/upload', extractBearerToken, authenticate, appController.uploadFile)



module.exports = router;