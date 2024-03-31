
const { readJsonFiles, checkValidKeyInDictionary, validateAccessToken, logError, logInfo, logWarning } = require('../commonServices/commonOperation');
const apiRequirementsConfig = readJsonFiles('./config/apiRequirements.json');
const otherConfig = readJsonFiles('./config/otherFeaturesConfigs.json');
const checkSessionMiddleware = async (req, res, next) => {

    try {

        var refresh_token = req.cookies['refresh_token']
        if (!refresh_token) {
            return res.status(401).json({ success: false, message: "Token Not Found" });
        }
        const projectName = req.body.projectName;
        const validateTokenInfo = validateAccessToken(refresh_token, otherConfig[projectName].tokenConfig.secretKey);
        if (validateTokenInfo) {

            req.validateTokenInfo = validateTokenInfo;
            return next();
        } else {
            return res.status(401).json({ success: false, message: "Token Not Provided" });
        }

    } catch (error) {
        // console.error('Exception in middleware', error);
        // message_error = { error: error.message, 'success': false, message: 'middleware error' };
        // logError({ ...message_error });
        return res.status(401).json({ success: false, message: "Unautorization" });
    }
}

const checkAccessTokenMiddleWare = async (req, res, next) => {
    try {
        const accessToken = req.headers.authorization.split('Bearer ').pop();
        if (!accessToken) {
            res.status(403).json({ success: false, message: "Forbidden" })
        }
        const tokenInfo = validateAccessToken(accessToken, otherConfig[projectName].tokenConfig.secretKey);
        if (tokenInfo) {
            req.tokenInfo = tokenInfo;
            return next();
        } else {
            message_error = { error: 'Invalid or expired access token', 'success': false, message: 'permission error' };
            logError({ ...message_error });
            return res.status(403).json(message_error);
        }


    } catch (error) {
        return res.status(401).json({ success: false, message: "Unautorization" })
    }
}

module.exports = { checkSessionMiddleware, checkAccessTokenMiddleWare };