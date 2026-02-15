
// const { readJsonFiles, getNewAccessToken } = require('../../commonServices/commonOperation');
// const apiRequirementsConfig = readJsonFiles('./src/config/apiRequirements.json');
// const otherConfig = readJsonFiles('./src/config/otherFeaturesConfigs.json');
const jwt = require('jsonwebtoken');

const jwkToPem = require('jwk-to-pem');



const axios = require('axios');
const configLoader = require('../../../configLoader');
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


const validateToken = async (token) => {
    try {
        const openIdUrl = configLoader.get('serverConfig')['OAUTH_LOGIN_SYSTEM']['OAUTH_OPENID_CONNECT']['production'];
        console.log("OpenID URL:", openIdUrl);

        // Fetch OpenID Discovery Document
        const discoveryResponse = await axios.get(openIdUrl);
        const { jwks_uri, issuer } = discoveryResponse.data;
        console.log("JWKS URI:", jwks_uri);

        // Fetch JWKS (JSON Web Key Set)
        const jwksResponse = await axios.get( "http://localhost:8000/.well-known/jwks.json");
        const jwks = jwksResponse.data.keys;

        // Decode JWT to get the 'kid' (Key ID) from header
        const decodedHeader = jwt.decode(token, { complete: true });
        const kid = decodedHeader.header.kid;
        console.log("Token kid:", kid);

        // Find the matching JWK
        const jwk = jwks.find(key => key.kid === kid);

        if (!jwk) {
            throw new Error("No matching JWK found for the token.");
        }

        // Convert JWK to PEM
        const publicKey = jwkToPem(jwk);

        // console.log(publicKey);
        

        // Verify the JWT
        const payload = jwt.verify(token, publicKey, {
            algorithms: ['RS256'], // Ensure RS256
            // issuer,               // Validate the issuer
        });

        console.log("✅ Token is valid:", payload);
        return payload;

    } catch (error) {
        console.error("❌ Token validation failed:", error.message);
        return null;
    }
};

const oauthGrantToken = async (req, res) => {
    try {
        console.log("====Calling OauthGrantToken====", req.body);

        // Get token URI from config
        const tokenUri = configLoader.get('serverConfig')['OAUTH_LOGIN_SYSTEM']['OAUTH_CREDENTIALS']['token_uri'];
        // console.log("Token URI:", tokenUri);

        // Make POST request to OAuth server
        const response = await axios.post(tokenUri, req.body, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log(response.data);

        const { access_token, refresh_token, refresh_exp } = response.data;

        const refreshExpiryMs = new Date(refresh_exp).getTime();
        // Calculate maxAge as the difference between refresh_exp and current time
        const maxAge = refreshExpiryMs - Date.now();
        // Set refresh token in a secure, HTTP-only cookie
        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie(`${isProduction ? '__Secure-' : ''}session-token`, refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: maxAge // Align cookie expiry with refresh token expiry
        });
        // Log and return the successful response
        console.log('Response from OAuth:', response.data);
        return res.status(200).json(response.data);

    } catch (error) {
        // Error handling for different scenarios
        if (error.response) {
            // Server responded with a status code outside 2xx
            console.error('Error Response:', error.response.data);
            return res.status(error.response.status).json({
                error: error.response.data,
                message: 'Error from OAuth server',
            });
        } else if (error.request) {
            // No response received from the server
            console.error('No Response from OAuth server:', error.request);
            return res.status(500).json({ message: 'No response from OAuth server' });
        } else {
            // Other errors (e.g., setup issues)
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





