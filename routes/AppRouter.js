const express = require('express');
const router = express.Router();
const appController = require('../controller/app/appController');


router.get('/app-configuration',appController.generateConfig)




module.exports = router;