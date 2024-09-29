
// const { readJsonFiles, getNewAccessToken } = require('../../commonServices/commonOperation');
// const apiRequirementsConfig = readJsonFiles('./src/config/apiRequirements.json');
// const otherConfig = readJsonFiles('./src/config/otherFeaturesConfigs.json');
const jwt = require('jsonwebtoken');
// const MongoDBManager = require('../../commonServices/mongoServices');
// const mongoDBManagerObj = new MongoDBManager();
// const mongoConfig = readJsonFiles('./config/mongoConfig.json');
// const grantPermission = async (req, res) => {
//     try {
//         var refresh_token = req.cookies['refresh_token']
//         const projectName = req.projectName;
//         const newAccessToken = getNewAccessToken(refresh_token, otherConfig[projectName]['tokenConfig']['secretKey'], otherConfig[projectName]['tokenConfig']['acess_expiration_delta']);
//         if (newAccessToken) {
          
//             var validateTokenInfo = req.validateTokenInfo;
//             const Login_info = {
//                 "message": 'ReLogin successful',
//                 'success': true,
//                 "authProvider": "Relogin-web",
//                 "login_info": {
//                     userFullName: validateTokenInfo.userName,
//                     email: validateTokenInfo.email,
//                     phone: validateTokenInfo.phone,
//                     image: validateTokenInfo.image,
//                     firstName: validateTokenInfo.firstName,
//                     lastName: validateTokenInfo.lastName
//                 },
//                 "accessToken": newAccessToken
//             };
//             return res.status(200).json(Login_info);
//         } else {
//             message_error = { message: 'Please provide valid refresh token', error: 'Please provide valid refresh token', 'success': false };
//             return res.status(400).json(message_error);
//         }
//     } catch (error) {
//         return res.status(400).json({ "message_info": error });
//     }
// }


// const newAccessToken = async (req, res) => {
//     try {
//         var refresh_token = req.cookies['refresh_token']
//         const projectName = req.body.projectName;
//         const newAccessToken = getNewAccessToken(refresh_token, otherConfig[projectName]['tokenConfig']['secretKey'], otherConfig[projectName]['tokenConfig']['acess_expiration_delta']);
//         if (newAccessToken) {
//             // var validateTokenInfo = req.validateTokenInfo;
//             // const Login_info = {
//             //     "message": 'ReLogin successful',
//             //     'success': true,
//             //     "authProvider":"Relogin-web",
//             //     "login_info": {
//             //         userFullName: validateTokenInfo.userName,
//             //         email: validateTokenInfo.email,
//             //         phone: validateTokenInfo.phone,
//             //         image:validateTokenInfo.image,
//             //         firstName: validateTokenInfo.firstName,
//             //         lastName: validateTokenInfo.lastName
//             //     },
//             //     "accessToken":newAccessToken  
//             // };
//             return res.status(200).json({ accessToken: newAccessToken });
//         } else {
//             message_error = { message: 'Please provide valid refresh token', error: 'Please provide valid refresh token', 'success': false };
//             return res.status(400).json(message_error);
//         }
//     } catch (error) {
//         return res.status(400).json({ "message_info": error });
//     }
// }


// Generate tokens
const generateTokens = (payload,config) => {
    // console.log(config);
    
    const {secretKey,refresh_expiration_delta,acess_expiration_delta}=config
    const access_token_exp = Math.floor(Date.now() / 1000) + acess_expiration_delta;
    const refresh_token_exp = Math.floor(Date.now() / 1000) + refresh_expiration_delta;

    const access_token_payload = {
        ...payload,
        exp: access_token_exp,
        iat: Math.floor(Date.now() / 1000),
    };
    const access_token = jwt.sign(access_token_payload, secretKey);

    const refresh_token_payload = {
        ...payload,
        exp: refresh_token_exp,
        iat: Math.floor(Date.now() / 1000),
    };
    const refresh_token = jwt.sign(refresh_token_payload, secretKey);
    // console.log('refresh_token--->', refresh_token)
    const refresh_token_data = jwt.verify(refresh_token, secretKey);
    // console.log('refresh_token_data--', refresh_token_data);

    return { access_token, refresh_token };
};


const getNewAccessToken = (refresh_token,config) => {
    try {
        const {secretKey,acess_expiration_delta}=config
        const refresh_token_data = jwt.verify(refresh_token, secretKey);
        // console.log('refresh_token_data', refresh_token_data);
        // Check if the refresh token has payload and expiration time
        if (refresh_token_data && refresh_token_data.exp && refresh_token_data) {
            const payload = refresh_token_data;
            // Create a new access token with an updated expiration time
            const new_access_token = jwt.sign({
                ...payload,
                exp: Math.floor(Date.now() / 1000) + acess_expiration_delta,
                iat: Math.floor(Date.now() / 1000)
            }, secretKey);

            return new_access_token;
        } else {
            // Handle invalid or missing payload in the refresh token
            console.error('Invalid or missing payload in the refresh token');
            return null;
        }
    } catch (error) {
        // Handle JWT verification errors
        console.error(`Error: ${error.message}`);
        return null;
    }
};


// Validate access token
const validateAccessToken = (access_token, config) => {
    try {
        const {secretKey}=config
        console.log('Validating access token...', access_token, secretKey);
        const decoded_token = jwt.verify(access_token, secretKey);
        const exp_datetime = new Date(decoded_token.exp * 1000);
        if (exp_datetime < Date.now()) {
            throw new Error('Token has expired');
        }
        return decoded_token;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return null;
    }
};

module.exports={
    generateTokens,
    getNewAccessToken,
    validateAccessToken
    // newAccessToken,
    // grantPermission
}





