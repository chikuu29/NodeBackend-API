
const jwt = require('jsonwebtoken');
const { oauth2Client } = require('../../../services/oauth2Client');
// Generate tokens
const generateTokens = (payload, config) => {
    // console.log(config);

    const { secretKey, refresh_expiration_delta, acess_expiration_delta } = config
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


const getNewAccessToken = (refresh_token, config) => {
    try {
        const { secretKey, acess_expiration_delta } = config
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
        const { secretKey } = config
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


/**
 * Validate a JWT using the OAuth2 server's JWKS (cached via oauth2Client).
 * Delegates to the singleton — discovery doc and JWKS are cached.
 */
const validateToken = async (token) => {
    return oauth2Client.validateToken(token);
};

/**
 * Exchange an authorization code for tokens via the OAuth2 server.
 * Sets the refresh_token as an httpOnly cookie for session persistence.
 */
const oauthGrantToken = async (req, res) => {
    try {
        console.log('====Calling OauthGrantToken====', req.body);

        // Delegate the token exchange to the OAuth2Client
        const tokenData = await oauth2Client.exchangeCode({
            code: req.body.code,
            redirect_url: req.body.redirect_url,
            device_id: req.body.device_id,
            code_verifier: req.body.code_verifier,
        });

        console.log('tokenData--->', tokenData);
        const { refresh_token, refresh_exp } = tokenData;

        // Set refresh token in a secure, httpOnly cookie
        const refreshExpiryMs = new Date(refresh_exp).getTime();
        const maxAge = refreshExpiryMs - Date.now();
        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie(`${isProduction ? '__Secure-' : ''}session-token`, refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge,
        });

        return res.status(200).json(tokenData);
    } catch (error) {
        if (error.response) {
            console.error('Error Response:', error.response.data);
            return res.status(error.response.status).json({
                error: error.response.data,
                message: 'Error from OAuth server',
            });
        } else if (error.request) {
            console.error('No Response from OAuth server:', error.request);
            return res.status(500).json({ message: 'No response from OAuth server' });
        } else {
            console.error('Request Error:', error.message);
            return res.status(500).json({ message: 'Request failed', error: error.message });
        }
    }
};



module.exports = {
    generateTokens,
    getNewAccessToken,
    validateAccessToken,
    oauthGrantToken,
    validateToken
    // newAccessToken,
    // grantPermission
}





