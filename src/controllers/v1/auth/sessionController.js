/**
 * Session Controller — Handles session hydration (/auth/me) and logout.
 *
 * Separated from userController to keep each controller focused on a single concern.
 * - createSession: Hydrates auth state on page refresh using the httpOnly cookie
 * - logoutUser: Revokes the refresh token on the OAuth2 server and clears the cookie
 */

const { oauth2Client } = require('../../../services/oauth2Client');
const { sendSuccess, sendError } = require('../../../utils/responseHandler');

// Cookie name varies by environment (security prefix in production)
const getSessionCookieName = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return `${isProduction ? '__Secure-' : ''}session-token`;
};

/**
 * GET /auth/me — Restore a session on page refresh.
 *
 * Flow:
 *  1. Read refresh_token from httpOnly cookie
 *  2. Exchange it for a fresh access_token via OAuth2 server
 *  3. If the server rotated the refresh_token, update the cookie
 *  4. Fetch fresh userinfo from OAuth2 server
 *  5. Return hydrated session data to the frontend
 */
const createSession = async (req, res) => {
    const cookieName = getSessionCookieName();

    try {
        const sessionToken = req.cookies[cookieName];
        console.log("sessionToken", sessionToken);
        if (!sessionToken) {
            return sendError(res, 401, 'Session expired. Please login again.');
        }

        // Step 1: Refresh the access token (pass device_id to prevent mismatch, rotate: false to reuse refresh token)
        const deviceId = req.headers['x-device-id'];
        const tokenData = await oauth2Client.refreshAccessToken(sessionToken, deviceId, false);
        const freshAccessToken = tokenData.access_token;

        // Step 2: If OAuth2 server rotated the refresh token, update the cookie
        if (tokenData.refresh_token && tokenData.refresh_token !== sessionToken) {
            const refreshExpiryMs = new Date(tokenData.refresh_exp).getTime();
            console.log("refreshExpiryMs", refreshExpiryMs);

            const maxAge = refreshExpiryMs - Date.now();

            res.cookie(cookieName, tokenData.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge,
            });
        }

        // Step 3: Fetch fresh user info — OAuth2 server is the sole source of truth
        const userInfo = await oauth2Client.getUserInfo(freshAccessToken);

        return sendSuccess(res, {
            authProvider: userInfo.authProvider || 'OAUTH',
            access_token: freshAccessToken,
            login_info: userInfo
        }, 'Session restored successfully');
    } catch (error) {
        console.error('createSession error:', error?.response?.data || error.message);

        // OAuth2 server rejected the token → session is invalid
        if (error?.response?.status === 400 || error?.response?.status === 401) {
            return sendError(res, 401, 'Session expired. Please login again.');
        }

        return sendError(res, 500, 'Failed to restore session.');
    }
};

/**
 * GET /auth/refresh — Lightweight token exchange.
 *
 * Unlike /auth/me (which fetches full user profile + permissions),
 * this endpoint ONLY exchanges the refresh_token for a new access_token.
 *
 * Performance comparison:
 *   /auth/me      → 2 HTTP calls to OAuth2 server (refresh + userinfo) + large payload
 *   /auth/refresh → 1 HTTP call to OAuth2 server (refresh only) + minimal payload
 *
 * Used by the Axios 401 interceptor for silent token refresh.
 * The frontend already has user info in Redux — it just needs a fresh token.
 */
const refreshToken = async (req, res) => {
    const cookieName = getSessionCookieName();

    try {
        const sessionToken = req.cookies[cookieName];

        if (!sessionToken) {
            return sendError(res, 401, 'Session expired. Please login again.');
        }

        // Single OAuth2 call — exchange refresh_token for new access_token (rotate: false for optimization)
        const deviceId = req.headers['x-device-id'];
        const tokenData = await oauth2Client.refreshAccessToken(sessionToken, deviceId, false);

        // If OAuth2 server rotated the refresh token, update the cookie
        if (tokenData.refresh_token && tokenData.refresh_token !== sessionToken) {
            const refreshExpiryMs = new Date(tokenData.refresh_exp).getTime();
            console.log("refreshExpiryMs", refreshExpiryMs);
            console.log("Date.now()", Date.now());
            const maxAge = refreshExpiryMs - Date.now();
            console.log("maxAge", maxAge);
            res.cookie(cookieName, tokenData.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge,
            });
        }

        // Minimal response — only the token the interceptor needs
        return sendSuccess(res, {
            access_token: tokenData.access_token,
        }, 'Token refreshed');
    } catch (error) {
        console.error('refreshToken error:', error?.response?.data || error.message);

        if (error?.response?.status === 400 || error?.response?.status === 401) {
            return sendError(res, 401, 'Session expired. Please login again.');
        }

        return sendError(res, 500, 'Failed to refresh token.');
    }
};

/**
 * GET /auth/logout — Revoke the session and clear the cookie.
 *
 * Requires extractBearerToken middleware to set req.accessToken.
 *
 * Flow:
 *  1. Read Bearer access_token (from middleware) and refresh_token (from cookie)
 *  2. Revoke the specific token (or all sessions as fallback) via POST /oauth2/revoke
 *  3. Clear the httpOnly session cookie
 *  4. Return success — frontend then clears Redux and redirects
 */
const logoutUser = async (req, res) => {
    const cookieName = getSessionCookieName();

    try {
        const refreshToken = req.cookies[cookieName];

        if (req.accessToken && refreshToken) {
            // Revoke the specific refresh token: POST /oauth2/revoke { token: "..." }
            await oauth2Client.revokeToken(req.accessToken, refreshToken);
        } else if (req.accessToken) {
            // No cookie — revoke all sessions for this client as fallback
            await oauth2Client.revokeAllSessions(req.accessToken);
        }
    } catch (error) {
        // Even if revocation fails, still clear the cookie and complete local logout
        console.warn('OAuth2 session revocation failed:', error?.response?.data || error.message);
    }

    // Clear the httpOnly cookie (options must match how it was set)
    res.clearCookie(cookieName, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
    });

    return sendSuccess(res, {
        logoutTime: new Date().toISOString(),
    }, 'Logged out successfully');
};

module.exports = { createSession, refreshToken, logoutUser };

