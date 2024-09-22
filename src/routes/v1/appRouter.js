const express = require('express');
const router = express.Router();
const appController = require('../../controllers/app/appController');
const { authenticate } = require('../../middlewares/identifyApplicationMiddlewares');


router.get('/app-configuration',authenticate, appController.generateConfig)




module.exports = router;