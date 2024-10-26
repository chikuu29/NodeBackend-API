const express = require('express');
const { addMember } = require('../../controllers/v1/gym/gymController');
const { authenticate } = require('../../middlewares/identifyApplicationMiddlewares');
const router = express.Router();


router.post('/addMember',authenticate, addMember)




module.exports=router








