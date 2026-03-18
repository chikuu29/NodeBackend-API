const express = require('express');
const { addMember } = require('./gym.controller');
const { authenticate } = require('../../middlewares/identifyApplicationMiddlewares');
const router = express.Router();


router.post('/addMember',authenticate, addMember)




module.exports=router








