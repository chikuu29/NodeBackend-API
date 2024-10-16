
const config = require('../configLoader');
const {validateAccessToken}=require('../controllers/v1/auth/authentication')
const checkSession = async (req, res, next) => {
    try {
        var refresh_token = req.cookies['refresh_token']
        const CLIENT_NAME = req.CLIENT_NAME
        if (!refresh_token) {
            return res.status(401).json({ success: false, message: "Login State Lost" });
        } else {
            // console.log("project Name", projectName);
            const validateTokenInfo = validateAccessToken(refresh_token, config.get('apiRequirementConfig')[CLIENT_NAME]['AUTH_PROCESS']['tokenConfig']);
            if (validateTokenInfo) {
                req.AUTH_INFO = validateTokenInfo;
                // req.projectName = projectName;
                return next();
            } else {
                return res.status(401).json({ success: false, message: "Login State Is Lost!" });
            }
        }

    } catch (error) {
        res.clearCookie('refresh_token', { httpOnly: true });
        return res.status(401).json({ success: false, message: "Unautorization" });
    }
}

const authenticate = async (req, res, next) => {
    try {
        const accessToken = req.headers.authorization.split('Bearer ').pop();
        if (!accessToken) {
            res.status(403).json({ success: false, message: "Forbidden" })
        }
        const CLIENT_NAME = req.CLIENT_NAME
        const tokenInfo = validateAccessToken(accessToken, config.get('apiRequirementConfig')[CLIENT_NAME]['AUTH_PROCESS']['tokenConfig']);
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

const identifyApplication = async (req, res, next) => {
    console.log("🚀 === Request received === 🚀");
    // Add more detailed logging if needed
    console.log(`Method: ${req.method}, URL: ${req.url}`);
    if(req.url=="/" || req.url.includes('public') || req.url.includes('oauth'))return next()
    // console.log("REQUEST FROM", req['headers']['x-requested-from']);
    // console.log("SERVER CONFIG", config.get('serverConfig'));
    try {
        X_CLIENT_ID = config.get('serverConfig')['X_CLIENT_ID'] || []
        // console.log("X_CLIENT_ID", X_CLIENT_ID);
        // // console.log("X",req['headers']['x-client-id']);
        // console.log("req['headers']",req['headers']);
        
        
        if (X_CLIENT_ID.includes(req['headers']['x-client-id'])) {
            // console.log("project Name", projectName);
            // const validateTokenInfo = validateAccessToken(refresh_token, otherConfig[projectName].tokenConfig.secretKey);
            // if (validateTokenInfo) {
            //     req.validateTokenInfo = validateTokenInfo;
                req.CLIENT_NAME = req['headers']['x-client-id'];
                return next();
            // } else {
            //     return res.status(401).json({ success: false, message: "Login State Is Lost!" });
            // }
            // return next();
        }else{
            return res.status(401).json({ success: false, message: "Unautorization Access" });
        }
    } catch (error) {
        return res.status(401).json({ success: false, message: "Unautorization Access" });
    }

}

module.exports = {identifyApplication,checkSession,authenticate };