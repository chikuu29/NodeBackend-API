// const express = require('express');
// const router = express.Router();
const bcrypt = require('bcrypt');
const { DateTime } = require('luxon');
const { parseUserAgent } = require('../../../utils/useragentUtils')
const { sendMail } = require('../../../services/emailService')
const { renderTemplate } = require('../../../utils/templateUtils')
const { createLogger } = require('../../../utils/loggerUtils')
const config = require('../../../configLoader');
const { dataSanitizer } = require('../../../utils/dataSanitizerUtils')
const { mongoClient } = require('../../../services/mongoService')
const { generateTokens, getNewAccessToken } = require('./authentication');
const { oauth2Client } = require('../../../services/oauth2Client');
const { required } = require('joi');

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

const createSession = async (req, res) => {
    console.log("===CALLING CREATESESSION===");

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = `${isProduction ? '__Secure-' : ''}session-token`;

    try {
        const sessionToken = req.cookies[cookieName];

        if (!sessionToken) {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again.',
            });
        }
        console.log("X-Device-ID:", req.headers['x-device-id']);
        // Step 1: Refresh the access token (pass device_id to prevent mismatch)
        const deviceId = req.headers['x-device-id'];
        const tokenData = await oauth2Client.refreshAccessToken(sessionToken, deviceId);
        const freshAccessToken = tokenData.access_token;

        // If the OAuth2 server rotates refresh tokens, update the cookie.
        // If not, the original long-lived refresh_token stays untouched.
        if (tokenData.refresh_token && tokenData.refresh_token !== sessionToken) {
            const isProduction = process.env.NODE_ENV === 'production';
            const refreshExpiryMs = new Date(tokenData.refresh_exp).getTime();
            const maxAge = refreshExpiryMs - Date.now();

            res.cookie(`${isProduction ? '__Secure-' : ''}session-token`, tokenData.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge,
            });
        }

        // Step 2: Fetch fresh user info from OAuth2 userinfo endpoint
        const userInfo = await oauth2Client.getUserInfo(freshAccessToken);
        console.log("User Info:", userInfo);
        // Build the hydration response — OAuth2 server is the sole source of truth
        const sessionResponse = {
            message: 'Session restored successfully',
            success: true,
            authProvider: userInfo.authProvider || 'OAUTH',
            access_token: freshAccessToken,
            login_info: {
                userFullName: userInfo.name || userInfo.userName || '',
                role: userInfo.role || '',
                email: userInfo.email || '',
                phone: userInfo.phone || null,
                image: userInfo.picture || userInfo.image || null,
                firstName: userInfo.given_name || userInfo.firstName || '',
                lastName: userInfo.family_name || userInfo.lastName || '',
                tenant_name: userInfo.tenant_name || null,
                permissions: userInfo.permissions || [],
            },
        };

        return res.status(200).json(sessionResponse);
    } catch (error) {
        console.error('createSession error:', error?.response?.data || error.message);

        // If OAuth2 server rejects the refresh_token, the session is invalid
        if (error?.response?.status === 400 || error?.response?.status === 401) {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please login again.',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Failed to restore session.',
        });
    }
}

const logoutUser = async (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = `${isProduction ? '__Secure-' : ''}session-token`;

    try {
        // req.accessToken is set by extractBearerToken middleware
        const refreshToken = req.cookies[cookieName];

        if (req.accessToken && refreshToken) {
            // Revoke the specific refresh token: POST /oauth2/revoke { token: "..." }
            await oauth2Client.revokeToken(req.accessToken, refreshToken);
        } else if (req.accessToken) {
            // No cookie — revoke all sessions for this client as fallback
            await oauth2Client.revokeAllSessions(req.accessToken);
        }
    } catch (error) {
        // Even if revocation fails (expired token, server down),
        // we still clear the cookie and complete the local logout.
        console.warn('OAuth2 session revocation failed:', error?.response?.data || error.message);
    }

    // Always clear the httpOnly cookie (must match the options used when setting it)
    res.clearCookie(cookieName, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
    });

    return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
        logoutTime: new Date().toISOString(),
    });
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
                        maxAge: 2 * 24 * 60 * 60 * 1000, // Set cookie expiration time (2 days)
                        path: '/' // Set a specific path for the refresh token cookie
                    }
                );
                // Prepare URL with only accessToken and refreshToken
                // const redirectUrl = `http://localhost:5173/auth/callback?` +
                //     `accessToken=${encodeURIComponent(tokens.access_token)}` +
                //     `&refreshToken=${encodeURIComponent(tokens.refresh_token)}`; // If needed, but already in cookie

                // res.redirect("https://myomspanel.onrender.com/myApps");
                // res.redirect('http://localhost:5173/myApps')
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
                // const message_info = {
                //     "message": 'Login successful',
                //     "authProvider": req.user.provider.toUpperCase() + "_OAUTH_MODE",
                //     'success': true,
                //     "login_info": {
                //         userFullName: oauthData.name,
                //         role: oauthData.role,
                //         image: oauthData.picture,
                //         email: oauthData.email,
                //         phone: oauthData.phone,
                //         firstName: oauthData.given_name,
                //         lastName: oauthData.family_name,
                //     },
                //     "accessToken": tokens.access_token
                // };
                res.setHeader('Authorization', `Bearer ${tokens.access_token}`);
                // Set refresh token in a secure cookie
                res.cookie(
                    'refresh_token',
                    tokens.refresh_token.toString(),
                    {
                        httpOnly: true,
                        sameSite: "Lax",
                        secure: true,
                        maxAge: 2 * 24 * 60 * 60 * 1000, // Set cookie expiration time (2 days)
                        path: '/' // Set a specific path for the refresh token cookie
                    }
                );
                // res.redirect("https://myomspanel.onrender.com/myApps");
                res.redirect(redirectTo)
            }

        }
        // console.log("storeDaata", storedData);
    } catch (error) {
        console.log("error", error);

    }

}



module.exports = {
    registerUser,
    loginUser,
    createSession,
    logoutUser,
    googleLogin
}



// exports.emailVerifyUser = async (req, res) => {
//     try {
//         const requestData = req.body;

//         const projectName = projectName || '';
//         const userFieldsConfig = apiRequirementsConfig[projectName].verifyUser;
//         const userFields = Object.keys(userFieldsConfig);

//         const userData = requestDataInjectionCheck(userFields, userFieldsConfig, req.body);
//         if (userData.error) {
//             const message_error = { message: 'input error', error: JSON.stringify(userData.error), 'success': false };
//             logError({ ...message_error });
//             return res.status(500).json(message_error);
//         }

//         const tokenInfo = req.tokenInfo;
//         const userName = tokenInfo.userName;
//         console.log("Verifying user: ", userName, userData);
//         if (userName !== userData.userName) {
//             message_error = { message: 'userName mismatch', error: 'userName mismatch', 'success': false };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         const userDataFromDbArr = await mongoDBManagerObj.findDocuments(mongoConfig[projectName].userCol, { 'userName': userData.userName }, {});
//         const userDataFromDb = userDataFromDbArr.length > 0 ? userDataFromDbArr[0] : {};

//         if (Object.keys(userDataFromDb).length === 0) {
//             message_error = { message: 'user not found', error: 'user not found', 'success': false, error: 'user not found' };
//             logError({ ...message_error });
//             return res.status(404).json(message_error);
//         }

//         const emailVefData = userDataFromDb.emailVefData || {};

//         if (emailVefData.otpTimeStamp < DateTime.now().minus({ minutes: otherConfig[projectName].verifyUser.otpExpiration }).toJSDate()) {
//             message_error = { message: 'otp expired', error: 'otp expired', 'success': false, error: 'otp expired' };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         if (userDataFromDb.email !== userData.email) {
//             message_error = { message: 'email mismatch', error: 'email mismatch', 'success': false, error: 'email mismatch' };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         if (emailVefData.blockedTillEmailVefTimeStamp > DateTime.now().toJSDate()) {
//             message_error = { message: 'user blocked', error: 'user blocked', 'success': false, error: 'User blocked till' + emailVefData.blockedTillEmailVefTimeStamp };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         if (emailVefData.otp !== userData.otp) {
//             if (emailVefData.numOfEmailVefFailAttempt >= otherConfig[projectName].verifyUser.numOfEmailVefFailAttempt) {
//                 const updateDataTemp = { 'emailVefData.blockedTillEmailVefTimeStamp': DateTime.now().plus({ minutes: otherConfig[projectName].verifyUser.blockedTillEmailMinutes }).toJSDate() };
//                 await mongoDBManagerObj.updateDocument(mongoConfig[projectName].userCol, { 'userName': userData.userName }, { '$set': updateDataTemp });
//                 message_error = { message: 'Maximum number of failed attempts reached', error: 'Maximum number of failed attempts reached', 'success': false, error: 'Maximum number of failed attempts reached' };
//                 logError({ ...message_error });
//                 return res.status(400).json(message_error);
//             }

//             const updateDataTemp = { 'emailVefData.numOfEmailVefFailAttempt': userDataFromDb.emailVefData.numOfEmailVefFailAttempt + 1 };
//             await mongoDBManagerObj.updateDocument(mongoConfig[projectName].userCol, { 'userName': userData.userName }, { '$set': updateDataTemp });
//             message_error = { message: 'Wrong otp', error: 'Wrong otp', 'success': false, error: 'Wrong otp' };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         if (emailVefData.otp === userData.otp && userDataFromDb.email === userData.email) {
//             if (emailVefData.verified === true) {
//                 message_error = { message: 'User already verified', error: 'User already verified', 'success': false, error: 'User already verified' };
//                 logError({ ...message_error });
//                 return res.status(400).json(message_error);
//             } else {
//                 const updateDataTemp = {
//                     'emailVefData.verified': true,
//                     'emailVefData.numOfEmailVefFailAttempt': 0,
//                     'emailVefData.otpTimeStamp': DateTime.now().toJSDate(),
//                     'emailVefData.blockedTillEmailVefTimeStamp': DateTime.now().toJSDate()
//                 };
//                 await mongoDBManagerObj.updateDocument(mongoConfig[projectName].userCol, { 'userName': userData.userName }, { '$set': updateDataTemp });
//                 message_error = { message: 'User verified successfully', error: 'User verified successfully', 'success': true };
//                 return res.status(200).json(message_error);
//             }
//         }
//     } catch (err) {
//         console.error('err--->', err);
//         message_error = { message: 'Error in verify user', error: 'Error in verify user', 'success': false };
//         logError({ ...message_error });
//         return res.status(500).json(message_error);
//     }
// }

// exports.updateUserEmail = async (request, res) => {
//     try {
//         const projectName = request.body.projectName;
//         console.log('-----1', projectName);

//         const userFieldsConfig = apiRequirementsConfig[projectName]['changeEmail'];
//         const userFields = Object.keys(userFieldsConfig);
//         console.log('-----3', userFields);

//         const userData = requestDataInjectionCheck(userFields, userFieldsConfig, request.body);
//         if (userData.error) {
//             const message_error = { message: 'input error', error: JSON.stringify(userData.error), 'success': false };
//             logError({ ...message_error });
//             return res.status(500).json(message_error);
//         }

//         console.log('-----5', userData);

//         const tokenInfo = request.tokenInfo;
//         console.log('-----4', tokenInfo);
//         const userName = tokenInfo.userName;

//         if (userName !== userData.userName) {
//             message_error = { message: 'wrong token', 'success': false, error: 'user name mismatch/wrong token' };
//             return res.status(400).json(message_error);
//         }

//         console.log('-----5', mongoConfig[projectName]['userCol']);

//         const userDataFromDbArr = await mongoDBManagerObj.findDocuments(mongoConfig[projectName]['userCol'], { userName: userData.userName }, {});
//         const userDataFromDb = userDataFromDbArr.length > 0 ? userDataFromDbArr[0] : {};
//         console.log('-----6', userDataFromDb);

//         if (!userDataFromDb) {
//             message_error = { message: 'User not found', error: 'User not found', 'success': false };
//             return res.status(404).json(message_error);
//         }

//         if (userDataFromDb.email === userData.newEmail) {
//             message_error = { message: 'same  email id cannot update', error: 'same  email id cannot update', 'success': false };
//             return res.status(400).json(message_error);
//         }

//         console.log('-----7');

//         const otp = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
//         const updateDataTemp = {
//             email: userData.newEmail,
//             'emailVefData.verified': false,
//             'emailVefData.otp': otp
//         };

//         await mongoDBManagerObj.updateDocument(mongoConfig[projectName]['userCol'], { userName: userData.userName }, { '$set': updateDataTemp });
//         message_info = { message: 'Email added  successfully to verify call verifyUser api', 'success': true };
//         logInfo({ ...message_info });
//         return res.status(200).json(message_info);

//     } catch (err) {
//         console.error('err--->', err);
//         message_error = { message: 'Error in update email', error: err.message, 'success': false };
//         logError({ ...message_error });
//         return res.status(500).json(message_error);
//     }

// }

// exports.getNewAcessToken = async (request, res) => {
//     try {
//         if (!request || !request.body || !request.body.projectName) {
//             message_error = { message: 'Please provide projectName', error: 'Please provide projectName', 'success': false };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         const projectName = request.body.projectName;
//         console.log('-----1', projectName);

//         if (!apiRequirementsConfig[projectName]) {
//             message_error = { message: 'projectName does not exist', error: 'projectName does not exist', 'success': false };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         if (!request.body.refresh_token) {
//             message_error = { message: 'Please provide refresh token', error: 'Please provide refresh token', 'success': false };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         const refresh_tokenArr = request.body.refresh_token.split('refresh_token=');
//         console.log('\n\n-----refresh_tokenArr---', refresh_tokenArr);
//         const refresh_token = refresh_tokenArr[refresh_tokenArr.length - 1].split(';')[0];
//         console.log('\n\n-----refresh_token---', refresh_token);
//         const acessToken = getNewAccessToken(refresh_token, otherConfig[projectName]['tokenConfig']['secretKey'], otherConfig[projectName]['tokenConfig']['acess_expiration_delta']);

//         if (!acessToken) {
//             message_error = { message: 'Please provide valid refresh token', error: 'Please provide valid refresh token', 'success': false };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }
//         res.setHeader('Authorization', `Bearer ${acessToken}`);
//         return res.status(200).json({ message: 'Token Refreshed', access_token: acessToken });
//     } catch (err) {
//         console.log('error in getNewAcessToken-->', err);
//         return res.status(500).json({ message: 'Error in getting new Refresh Token' });
//     }

// }

// exports.AssignRoleToUser = async (request, res) => {
//     try {
//         if (!request || !request.body || !request.body.projectName) {
//             message_error = { message: 'Please provide projectName', error: 'Please provide projectName', 'success': false };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         const projectName = request.body.projectName;

//         if (!apiRequirementsConfig[projectName]) {
//             message_error = { message: 'projectName does not exist', error: 'projectName does not exist', 'success': false };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         const userFieldsConfig = apiRequirementsConfig[projectName]['AssignRoleToUser'];
//         const userFields = Object.keys(userFieldsConfig);

//         const userData = requestDataInjectionCheck(userFields, userFieldsConfig, req.body);
//         if (userData.error) {
//             const message_error = { message: 'input error', error: JSON.stringify(userData.error), 'success': false };
//             logError({ ...message_error });
//             return res.status(500).json(message_error);
//         }

//         const userName = request.body.userName;
//         const userNameToBeAssignedRole = request.body.userNameToAssignRole;
//         const assignedRoleName = request.body.assignedRoleName;

//         const rolesArr = await mongoDBManagerObj.findDocuments(mongoConfig[projectName]['apiSettings'], { settingName: "ApisAllowedRoles" }, {});
//         if (rolesArr.length === 0 || !rolesArr[0][assignedRoleName]) {
//             message_error = { message: `Invalid role name ${assignedRoleName}`, error: `Invalid role name ${assignedRoleName}`, 'success': false };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         const tokenInfo = request.tokenInfo;
//         const tokenUserName = tokenInfo.userName;

//         if (tokenUserName !== userData.userName) {
//             message_error = { message: 'wrong token', error: 'wrong token', 'success': false };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         await mongoDBManagerObj.updateDocument(mongoConfig[projectName]['apiSettings'], { settingName: "userIdWithRoles" }, { '$push': { 'role': userData.role } });
//         message_info = { message: 'Role Assigned', 'success': true };
//         logInfo({ ...message_info });
//         return res.status(200).json(message_info);
//     } catch (err) {
//         console.log('err--->', err);
//         message_error = { message: 'Error in AssignRoleToUser', error: err.message, 'success': false };
//         logError({ ...message_error });
//         return res.status(500).json(message_error);
//     }

// }

// exports.updateUserBasicData = async (request, res) => {
//     try {
//         const projectName = request.body['projectName'];
//         console.log('-----1', projectName);

//         const userFieldsConfig = apiRequirementsConfig[projectName]['changeBasicData'];
//         const userFields = Object.keys(userFieldsConfig);
//         console.log('-----3', userFields);

//         const userData = requestDataInjectionCheck(userFields, userFieldsConfig, req.body);
//         if (userData.error) {
//             const message_error = { message: 'input error', error: JSON.stringify(userData.error), 'success': false };
//             logError({ ...message_error });
//             return res.status(500).json(message_error);
//         }

//         const tokenInfo = request.tokenInfo;
//         console.log('-----4', tokenInfo);
//         const userName = tokenInfo['userName'];

//         if (userName !== userData['userName']) {
//             message_error = { message: 'wrong token', error: 'wrong token', 'success': false };
//             logError({ ...message_error });
//             return res.status(400).json(message_error);
//         }

//         console.log('-----5', mongoConfig[projectName]['userCol']);
//         const userDataFromDbArr = await mongoDBManagerObj.findDocuments(mongoConfig[projectName]['userCol'], { 'userName': userData['userName'] }, {});
//         const userDataFromDb = userDataFromDbArr.length > 0 ? userDataFromDbArr[0] : {};

//         console.log('-----6', userDataFromDb);
//         if (!userDataFromDb) {
//             message_error = { message: 'User not found', error: 'User not found', 'success': false };
//             logError({ ...message_error });
//             return res.status(404).json(message_error);
//         }

//         console.log('-----7');
//         const updateDataTemp = userData;
//         await mongoDBManagerObj.updateDocument(mongoConfig[projectName]['userCol'], { 'userName': userData['userName'] }, { '$set': updateDataTemp });
//         message_info = { message: 'User Basic data updated successfully', 'success': true, data: userData };
//         logInfo({ ...message_info });
//         return res.status(200).json(message_info);
//     } catch (err) {
//         console.log('Error in update basic data-->', err);
//         message_error = { message: 'Error in update basic data', error: err.message, 'success': false };
//         logError({ ...message_error });
//         return res.status(500).json(message_error);
//     }

// }
