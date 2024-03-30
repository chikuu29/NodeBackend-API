
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


module.exports = checkSessionMiddleware;