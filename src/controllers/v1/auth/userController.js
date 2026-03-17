/**
 * User Controller — Handles user registration, login, and Google OAuth callback.
 *
 * Session-related handlers (createSession, logoutUser) are in sessionController.js.
 */
const bcrypt = require('bcrypt');
const { DateTime } = require('luxon');
const { parseUserAgent } = require('../../../utils/useragentUtils');
const { sendMail } = require('../../../services/emailService');
const { renderTemplate } = require('../../../utils/templateUtils');
const { createLogger } = require('../../../utils/loggerUtils');
const config = require('../../../configLoader');
const { dataSanitizer } = require('../../../utils/dataSanitizerUtils');
const { mongoClient } = require('../../../services/mongoService');
const { generateTokens, getNewAccessToken } = require('./authentication');

const registerUser = async (req, res) => {
    try {
        console.log(req.body);

        // console.log('req.body :', req.body);

        // const { projectName } = req.body;
        // if (!apiRequirementsConfig[projectName]) {
        //     const message_error = { error: 'projectName does not exist', 'success': false, message: 'input error' };
        //     logError({ ...message_error });
        //     return res.status(400).json(message_error);
        // }
        // const userFieldsConfig = apiRequirementsConfig[projectName].registerFields;
        // const userFields = Object.keys(userFieldsConfig);
        // const userData = requestDataInjectionCheck(userFields, userFieldsConfig, req.body);
        // if (userData.error) {
        //     const message_error = { message: 'input error', error: JSON.stringify(userData.error), 'success': false };
        //     logError({ ...message_error });
        //     return res.status(500).json(message_error);
        // }
        // // console.log('userData :', userData);
        // const existingUser = await mongoDBManagerObj.findDocuments(mongoConfig[projectName].userCol, { email: userData.email, phone: userData.phone }, {});
        // if (existingUser.length === 0) {
        //     const hashed_password = await bcrypt.hash(userData.password, 10);
        //     userData.password = hashed_password;
        //     const otp = Math.floor(100000 + Math.random() * 900000).toString();
        //     var emailVefData = {
        //         otp,
        //         otpTimeStamp: DateTime.now(),
        //         numOfEmailVefFailAttempt: 0,
        //         blockedTillEmailVefTimeStamp: DateTime.now(),
        //         verified: false,
        //     };
        //     userData.emailVefData = emailVefData;
        //     userData['numOfLoginFailAttempt'] = 0
        //     userData['blockTillLogInTimeStamp'] = DateTime.now()
        //     // You need to implement the send_otp_email function
        //     send_otp_email(userData.email, otp);
        //     var { emailVefData, ...userDataSendRes } = userData;
        //     await mongoDBManagerObj.insertDocument(mongoConfig[projectName].userCol, userData);
        //     const message_info = { message: `User: ${userData.userName} registered successfully`, projectName, 'success': true, data: userDataSendRes };
        //     logInfo({ ...message_info });
        //     return res.status(200).json(message_info);
        // } else {
        //     const message_info = { error: `User: ${userData.userName} already exists`, projectName, 'success': false, message: 'User already exists' };
        //     logInfo({ ...message_info });
        //     return res.status(409).json(message_info);
        // }
    } catch (err) {
        console.error('error in registering user-->', err);
        const message_error = { message: `Error in registering user`, success: false, error: err.message };
        // logError({ ...message_error });
        return res.status(500).json(message_error);
    }
};




const loginUser = async (req, res) => {
    console.log("===CALLING LOGIN CONTROLLRS===");

    try {
        const requestData = req.body;
        const CLIENT_NAME = req.CLIENT_NAME
        if (!requestData || !CLIENT_NAME) {
            return res.status(400).json({ error: 'Please provide Project Name', 'success': false, message: 'Input error' });
        }
        if (!config.get('apiRequirementConfig')[CLIENT_NAME]) {
            return res.status(400).json({ error: 'projectName does not exist', 'success': false, message: 'Input error' });
        }

        const userFieldsConfig = config.get('apiRequirementConfig')[CLIENT_NAME]['loginFields'];
        const userFields = Object.keys(userFieldsConfig);

        const userData = dataSanitizer(userFields, userFieldsConfig, req.body);
        if (userData.error) {
            const message_error = {
                message: 'input error',
                error: JSON.stringify(userData.error),
                'success': false
            };
            logError({ ...message_error });
            return res.status(500).json(message_error);
        }
        const query = {
            $or: [
                {
                    email: userData['loginId']
                },
                {
                    phone: userData['loginId']
                }
            ]
        }
        const storedData = await mongoClient.find('user', query, {});
        // console.log("storedData", storedData);
        if (storedData.length > 0) {
            const storedHashedPassword = storedData[0].password;
            const providedPassword = userData['password'];
            if (storedData[0].blockTillLogInTimeStamp > DateTime.now()) {
                console.log("User is blocked till", storedData[0].blockTillLogInTimeStamp);
                return res.status(401).json({ message: 'User is blocked', 'success': false, message: 'Your account is blocked due to too many failed login attempts. Please wait and try again later. (' + new Date(storedData[0].blockTillLogInTimeStamp).getMinutes() + ' Minutes )' });
            }
            if (bcrypt.compareSync(providedPassword, storedHashedPassword)) {
                // Get device information
                const deviceInfo = {
                    ...parseUserAgent(req.headers['user-agent']),
                    ...{
                        dateTimeAt: new Date().toISOString(), ip: req.ip
                    }
                };
                // Ensure devices array exists
                if (!storedData[0].devices) {
                    storedData[0]['devices'] = [];

                }
                const knownDevice = storedData[0].devices.find(
                    (device) => device.ip === deviceInfo.ip && device.browser === deviceInfo.browser
                );
                if (!knownDevice) {
                    // New device detected, send notification
                    // console.log(deviceInfo);
                    const htmlContent = await renderTemplate('newDeviceLogin.ejs', deviceInfo);
                    const mailOptions = {
                        to: [storedData[0].email],
                        subject: 'New Device Login Detected',
                        html: htmlContent
                    };
                    sendMail(mailOptions)
                    storedData[0].devices.push(deviceInfo)
                    await mongoClient.update('user', { email: storedData[0].email },
                        { devices: storedData[0].devices })

                }
                const payload = {
                    authProvider: "MANUAL_LOGIN_MODE",
                    userName: storedData[0].userName,
                    firstName: storedData[0].firstName,
                    lastName: storedData[0].lastName,
                    image: null,
                    email: storedData[0].email,
                    phone: storedData[0].phone,
                    role: "user"
                };
                console.log('HII');

                console.log("ok", config.get('apiRequirementConfig')[CLIENT_NAME]['AUTH_PROCESS']['tokenConfig']);

                const tokens = generateTokens(payload, config.get('apiRequirementConfig')[CLIENT_NAME]['AUTH_PROCESS']['tokenConfig']);
                const message_info = {
                    "message": 'Login successful',
                    "authProvider": "login-web",
                    'success': true,
                    "login_info": {
                        userFullName: storedData[0].userName,
                        role: storedData[0].role,
                        image: storedData[0].image,
                        email: storedData[0].email,
                        phone: storedData[0].phone,
                        firstName: storedData[0].firstName,
                        lastName: storedData[0].lastName
                    },
                    "accessToken": tokens.access_token
                };
                // res.setHeader('Authorization', `Bearer ${tokens.access_token}`);
                // Set refresh token in a secure cookie
                res.cookie(
                    'refresh_token',
                    tokens.refresh_token.toString(),
                    {
                        path: '/',
                        httpOnly: true,
                        sameSite: "Lax",
                        secure: true,
                        // maxAge: 2 * 24 * 60 * 60 * 1000, // Set cookie expiration time (2 days)
                        // path: '/' // Set a specific path for the refresh token cookie
                    }
                );
                // res.redirect(`${"http://localhost:5173/callback"}?code=${"ok"}`);

                return res.status(200).json(message_info);
            } else {
                // Handle incorrect password case
                // if (storedData[0].numOfLoginFailAttempt >= otherConfig[projectName]['verifyUser']['numOfLoginFailAttempt']) {
                //     const updateDataTemp = { blockTillLogInTimeStamp: DateTime.now().plus({ minutes: otherConfig[projectName]['verifyUser']['blockedTillEmailMinutes'] }) };
                //     await mongoDBManagerObj.updateDocument(mongoConfig[projectName]['userCol'], { '_id': storedData[0]['_id'] }, { '$set': updateDataTemp });
                // }
                // const numOfLoginFailAttempt = { numOfLoginFailAttempt: storedData[0].numOfLoginFailAttempt + 1 };
                // await mongoDBManagerObj.updateDocument(mongoConfig[projectName]['userCol'], { '_id': storedData[0]['_id'] }, { '$set': numOfLoginFailAttempt });
                // console.log("Incorrect password");
                let message_error = { message: 'Incorrect password', 'success': false, error: 'Incorrect password' };
                // ok=createLogger(CLIENT_NAME)
                createLogger(CLIENT_NAME).info(JSON.stringify(message_error))
                // logError({ ...message_error });
                return res.status(401).json(message_error);
            }
        } else {
            return res.status(404).json({ error: 'User does not exist', 'success': false, message: 'User Not Found' });
        }
    } catch (err) {
        // console.error('error in login user-->', err);
        const message_error = { message: 'error in login user', error: err.message, 'success': false };
        // logError({ ...message_error });
        return res.status(500).json(message_error);
    }
}

const googleLogin = async (req, res) => {
    try {
        const state = req.query.state ? JSON.parse(req.query.state) : {};
        const redirectTo = state.redirectTo || '/';
        const oauthData = req.user['_json'];
        const query = {
            email: oauthData['email']
        }
        const storedData = await mongoClient.findOne('user', query, { _id: 1, email: 1, oauth: 1, });
        let OAuthData = {
            oauth: {
                "GoogleOauth": { ...oauthData, ...{ dateTimeAt: new Date().toISOString() } }
            },

        }
        if (storedData) {
            if (oauthData.email_verified) {

                OAuthData['image'] = oauthData.picture
                await mongoClient.update('user', { email: storedData.email }, OAuthData)
                console.log(storedData);
                const payload = {
                    authProvider: req.user.provider.toUpperCase() + "_OAUTH_MODE",
                    userName: oauthData.name,
                    firstName: oauthData.given_name,
                    lastName: oauthData.family_name,
                    image: oauthData.picture,
                    email: oauthData.email,
                    phone: oauthData.phone || storedData.phone,
                    role: "user"
                };
                const tokens = generateTokens(payload, config.get('apiRequirementConfig')["LOCAL_BASELINE"]['AUTH_PROCESS']['tokenConfig']);

                res.cookie(
                    'refresh_token',
                    tokens.refresh_token.toString(),
                    {
                        httpOnly: true,
                        sameSite: "Lax",
                        secure: true,
                        maxAge: 2 * 24 * 60 * 60 * 1000,
                        path: '/'
                    }
                );
                res.redirect(redirectTo)
            }
        } else {
            if (oauthData.email_verified) {
                const userInfo = {
                    registerMode: 'OAUTH',
                    role: 'user',
                    image: oauthData.picture,
                    userName: oauthData.name,
                    email: oauthData.email,
                    phone: null,
                    firstName: oauthData.given_name,
                    lastName: oauthData.family_name,
                    address: null,
                    ...OAuthData
                }

                console.log("UserInfor", userInfo);
                await mongoClient.insert('user', userInfo)
                const payload = {
                    authProvider: req.user.provider.toUpperCase() + "_OAUTH_MODE",
                    userName: oauthData.name,
                    firstName: oauthData.given_name,
                    lastName: oauthData.family_name,
                    image: oauthData.picture,
                    email: oauthData.email,
                    phone: oauthData.phone || null,
                    role: "user"
                };
                const tokens = generateTokens(payload, config.get('apiRequirementConfig')["LOCAL_BASELINE"]['AUTH_PROCESS']['tokenConfig']);
                res.setHeader('Authorization', `Bearer ${tokens.access_token}`);
                res.cookie(
                    'refresh_token',
                    tokens.refresh_token.toString(),
                    {
                        httpOnly: true,
                        sameSite: "Lax",
                        secure: true,
                        maxAge: 2 * 24 * 60 * 60 * 1000,
                        path: '/'
                    }
                );
                res.redirect(redirectTo)
            }

        }
    } catch (error) {
        console.log("error", error);

    }

}

module.exports = {
    registerUser,
    loginUser,
    googleLogin,
};
