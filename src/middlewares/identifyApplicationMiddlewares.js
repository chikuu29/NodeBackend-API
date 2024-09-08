
const config = require('../configLoader');
const {validateAccessToken}=require('../controllers/v1/auth/authentication')
const checkSession = async (req, res, next) => {
    try {
        var refresh_token = req.cookies['refresh_token']
        const REQUESTED_APP_NAME = req.REQUESTED_APP_NAME
        if (!refresh_token) {
            // const requestedDomain = req.hostname;
            // res.cookie(
            //     'callback-url',
            //     requestedDomain.toString(),
            //     {
            //         sameSite: "None",
            //         httpOnly: true,
            //         secure: true,
            //         maxAge: 2 * 24 * 60 * 60 * 1000, // Set cookie expiration time (2 days)
            //         path: '/' // Set a specific path for the refresh token cookie
            //     }
            // );
            // res.cookie(
            //     'projectName',
            //     "projectOne",
            //     {
            //         httpOnly: true,
            //         sameSite: "None",
            //         secure: true,
            //         maxAge: 2 * 24 * 60 * 60 * 1000, // Set cookie expiration time (2 days)
            //         path: '/' // Set a specific path for the refresh token cookie
            //     }
            // );
            return res.status(401).json({ success: false, message: "Login State Lost" });
        } else {

            // console.log("project Name", projectName);
            const validateTokenInfo = validateAccessToken(refresh_token, config.get('apiRequirementConfig')[REQUESTED_APP_NAME]['AUTH_PROCESS']['tokenConfig']);
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

// const checkAccessTokenMiddleWare = async (req, res, next) => {
//     try {
//         const accessToken = req.headers.authorization.split('Bearer ').pop();
//         if (!accessToken) {
//             res.status(403).json({ success: false, message: "Forbidden" })
//         }
//         const projectName = req.cookies['projectName'] ? req.cookies['projectName'] : req.body.projectName;
//         const tokenInfo = validateAccessToken(accessToken, otherConfig[projectName].tokenConfig.secretKey);
//         if (tokenInfo) {
//             req.tokenInfo = tokenInfo;
//             return next();
//         } else {
//             message_error = { error: 'Invalid or expired access token', 'success': false, message: 'permission error' };
//             logError({ ...message_error });
//             return res.status(403).json(message_error);
//         }


//     } catch (error) {
//         return res.status(401).json({ success: false, message: "Unautorization" })
//     }
// }

const identifyApplication = async (req, res, next) => {
    console.log("🚀 === Request received === 🚀");
    // Add more detailed logging if needed
    console.log(`Method: ${req.method}, URL: ${req.url}`);
    // console.log("REQUEST FROM", req['headers']['x-requested-from']);
    // console.log("SERVER CONFIG", config.get('serverConfig'));
    try {
        CONNECTION_ALLOW_APPLICATION = config.get('serverConfig')['CONNECTION_ALLOW_APPLICATION'] || []
        console.log("CONNECTION_ALLOW_APPLICATION", CONNECTION_ALLOW_APPLICATION);
        if (CONNECTION_ALLOW_APPLICATION.includes(req['headers']['x-requested-from'])) {
            // console.log("project Name", projectName);
            // const validateTokenInfo = validateAccessToken(refresh_token, otherConfig[projectName].tokenConfig.secretKey);
            // if (validateTokenInfo) {
            //     req.validateTokenInfo = validateTokenInfo;
                req.REQUESTED_APP_NAME = req['headers']['x-requested-from'];
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

module.exports = {identifyApplication,checkSession };