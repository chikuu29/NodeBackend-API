
const config = require('../core/config');
const { validateAccessToken, validateToken } = require('../modules/auth/auth.controller')
const checkSession = async (req, res, next) => {
    try {
        console.log("checkkk", req.cookies);
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieName = `${isProduction ? '__Secure-' : ''}session-token`;
        console.log(cookieName);

        var refresh_token = req.cookies[cookieName]
        console.log("--- refresh_token ---", refresh_token);


        const CLIENT_NAME = req.CLIENT_NAME
        if (!refresh_token) {
            return res.status(401).json({ success: false, message: "Login State Lost" });
        } else {
            // console.log("project Name", projectName);
            // const validateTokenInfo = validateAccessToken(refresh_token, config.get('apiRequirementConfig')[CLIENT_NAME]['AUTH_PROCESS']['tokenConfig']);
            const decodeData = await validateToken(refresh_token)
            console.log("validateToken", decodeData);
            if (decodeData) {
                req.AUTH_INFO = decodeData;
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

/**
 * Centralized Bearer token extraction.
 * Parses `Authorization: Bearer <token>` and sets `req.accessToken`.
 * If the header is missing or malformed, `req.accessToken` is null.
 *
 * Usage: attach before any handler that needs the access token.
 *   router.get('/some-route', extractBearerToken, handler);
 *   // In handler: const token = req.accessToken;
 */
const extractBearerToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    req.accessToken = (authHeader && authHeader.startsWith('Bearer '))
        ? authHeader.slice(7)  // 'Bearer '.length === 7
        : null;

    return next();
};

/**
 * Authentication middleware — validates the Bearer token via OAuth2 JWKS.
 * Requires `extractBearerToken` to run first (or be chained).
 */
const authenticate = async (req, res, next) => {
    try {
        // Use centralized extraction if not already done
        const accessToken = req.accessToken;

        // No token provided at all → 401
        if (!accessToken) {
            return res.status(401).json({ success: false, message: 'Access token is required' });
        }

        const tokenInfo = await validateToken(accessToken);

        if (tokenInfo) {
            req.tokenInfo = tokenInfo;
            req.accessToken = accessToken;
            return next();
        }

        // Token is expired or invalid → 401 (NOT 403)
        // 401 = credentials missing/expired — triggers frontend silent refresh
        // 403 = authenticated but lacking permissions — different semantic
        return res.status(401).json({ success: false, message: 'Access token expired or invalid' });
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
};

const identifyApplication = async (req, res, next) => {
    console.log("🚀 === Request received === 🚀");
    const url = req.headers['referer'] || ''
    const appMatch = url.match(/[?&]app=([^&]+)/)
    const app = appMatch ? appMatch[1] : null
    console.log(`Method: ${req.method}, URL: ${req.url}`);
    if (req.url == "/" || req.url.includes('public') || req.url.includes('oauth')) return next()
    try {
        X_CLIENT_ID = config.get('serverConfig')['X_CLIENT_ID'] || []
        if (X_CLIENT_ID.includes(req['headers']['x-client-id'])) {
            req.CLIENT_NAME = req['headers']['x-client-id'];
            req.APP_DB_COLLECTION = config.get('databaseConfig')['prefixCollection'][app] || null
            req.appName = app || 'defult'
            return next();
        } else {
            return res.status(401).json({ success: false, message: "Unautorization Access" });
        }
    } catch (error) {
        return res.status(401).json({ success: false, message: "Unautorization Access" });
    }

}

module.exports = { identifyApplication, checkSession, authenticate, extractBearerToken };