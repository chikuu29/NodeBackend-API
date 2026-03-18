const express = require('express');
const oauthRoutesV1 = require('../modules/oauth/oauth.routes');
const authRoutesV1 = require('../modules/auth/auth.routes');
const appRoutesV1 = require('../modules/app/app.routes');
const gymRoutersV1 = require('../modules/gym/gym.routes');

const router = express.Router();

router.use('/v1/app', appRoutesV1);
router.use('/v1/auth', authRoutesV1);
router.use('/v1/oauth', oauthRoutesV1);
router.use('/v1/gym', gymRoutersV1);

module.exports = router;
