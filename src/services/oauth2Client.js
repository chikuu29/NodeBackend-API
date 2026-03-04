/**
 * OAuth2Client — Centralized OAuth2 server communication service.
 *
 * Responsibilities:
 *  1. Cache the OpenID discovery document (avoids hitting /.well-known on every request)
 *  2. Cache JWKS keys for token validation
 *  3. Exchange authorization codes for tokens
 *  4. Refresh access tokens via refresh_token grant
 *  5. Fetch user info from the userinfo endpoint
 *  6. Validate JWTs using the OAuth2 server's JWKS
 *
 * Usage:
 *   const { oauth2Client } = require('./services/oauth2Client');
 *   const tokens = await oauth2Client.exchangeCode(code, redirectUrl, deviceId, codeVerifier);
 *   const userInfo = await oauth2Client.getUserInfo(accessToken);
 *   const payload = await oauth2Client.validateToken(token);
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

class OAuth2Client {
    constructor() {
        /**
         * Cached OpenID discovery document.
         * Contains token_endpoint, userinfo_endpoint, jwks_uri, etc.
         */
        this._discoveryCache = null;

        /** Timestamp (ms) when the discovery cache was last fetched */
        this._discoveryCachedAt = 0;

        /** Cached JWKS keys (array of JWK objects) */
        this._jwksCache = null;

        /** Timestamp (ms) when JWKS was last fetched */
        this._jwksCachedAt = 0;

        /**
         * TTL for caches in milliseconds.
         * Discovery docs and JWKS rarely change — 10 minutes is safe.
         */
        this._cacheTTL = 10 * 60 * 1000;
    }

    // ───────────────────────────────────────────────
    // Discovery & JWKS (cached)
    // ───────────────────────────────────────────────

    /**
     * Fetch and cache the OpenID Connect discovery document.
     * Returns cached version if within TTL.
     *
     * @returns {Promise<Object>} Discovery document with endpoints
     */
    async getDiscovery() {
        const now = Date.now();

        if (this._discoveryCache && (now - this._discoveryCachedAt) < this._cacheTTL) {
            return this._discoveryCache;
        }

        const openIdUrl = process.env.OAUTH_OPENID_CONFIG_URL;
        if (!openIdUrl) {
            throw new Error('OAUTH_OPENID_CONFIG_URL is not set in environment variables.');
        }

        const response = await axios.get(openIdUrl);
        this._discoveryCache = response.data;
        this._discoveryCachedAt = now;

        return this._discoveryCache;
    }

    /**
     * Fetch and cache JWKS (JSON Web Key Set) from the OAuth2 server.
     * Used for validating JWT signatures.
     *
     * @returns {Promise<Array>} Array of JWK key objects
     */
    async getJWKS() {
        const now = Date.now();

        if (this._jwksCache && (now - this._jwksCachedAt) < this._cacheTTL) {
            return this._jwksCache;
        }

        const discovery = await this.getDiscovery();
        const jwksUri = discovery.jwks_uri;

        const response = await axios.get(jwksUri);
        this._jwksCache = response.data.keys;
        this._jwksCachedAt = now;

        return this._jwksCache;
    }

    /**
     * Invalidate all caches. Useful when a key rotation is detected.
     */
    clearCache() {
        this._discoveryCache = null;
        this._discoveryCachedAt = 0;
        this._jwksCache = null;
        this._jwksCachedAt = 0;
    }

    // ───────────────────────────────────────────────
    // Token Operations
    // ───────────────────────────────────────────────

    /**
     * Exchange an authorization code for tokens (authorization_code grant).
     * Called during the OAuth callback flow.
     *
     * @param {Object} params - Token exchange parameters
     * @param {string} params.code - Authorization code from the OAuth2 server
     * @param {string} params.redirect_url - Redirect URI used in the auth request
     * @param {string} params.device_id - Device identifier
     * @param {string} [params.code_verifier] - PKCE code verifier (if S256 was used)
     * @returns {Promise<Object>} Token response (access_token, refresh_token, login_info, etc.)
     */
    async exchangeCode({ code, redirect_url, device_id, code_verifier }) {
        const discovery = await this.getDiscovery();
        const tokenUrl = discovery.token_endpoint || process.env.OAUTH_TOKEN_URI;
        console.log("Token URL:", tokenUrl);
        console.log("Discovery:", discovery);
        const payload = {
            grant_type: 'authorization_code',
            code,
            redirect_url,
            device_id,
            client_id: process.env.OAUTH_CLIENT_ID,
            client_secret: process.env.OAUTH_CLIENT_SECRET,
        };

        // Include PKCE verifier only when present
        if (code_verifier) {
            payload.code_verifier = code_verifier;
        }
        console.log("Payload:", payload);
        const response = await axios.post(tokenUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
        });

        return response.data;
    }

    /**
     * Refresh the access token using a refresh_token grant.
     * Called by /auth/me to get a fresh access_token on every page refresh.
     *
     * @param {string} refreshToken - The refresh token (stored in httpOnly cookie)
     * @returns {Promise<Object>} Token response with fresh access_token
     */
    async refreshAccessToken(refreshToken) {
        const discovery = await this.getDiscovery();
        const tokenUrl = discovery.token_endpoint || process.env.OAUTH_TOKEN_URI;

        const response = await axios.post(tokenUrl, {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: process.env.OAUTH_CLIENT_ID,
            client_secret: process.env.OAUTH_CLIENT_SECRET,
        }, {
            headers: { 'Content-Type': 'application/json' },
        });

        return response.data;
    }

    // ───────────────────────────────────────────────
    // User Info
    // ───────────────────────────────────────────────

    /**
     * Fetch the authenticated user's profile from the OAuth2 server's
     * userinfo endpoint. Returns the latest roles, permissions, and profile data.
     *
     * @param {string} accessToken - A valid access token
     * @returns {Promise<Object>} User info from the OAuth2 server
     */
    async getUserInfo(accessToken) {
        const discovery = await this.getDiscovery();
        const userinfoUrl = discovery.userinfo_endpoint;

        if (!userinfoUrl) {
            throw new Error('userinfo_endpoint not found in OpenID discovery document.');
        }

        const response = await axios.get(userinfoUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        return response.data;
    }

    // ───────────────────────────────────────────────
    // Token Validation (JWKS)
    // ───────────────────────────────────────────────

    /**
     * Validate a JWT against the OAuth2 server's JWKS.
     * Verifies the signature using the matching public key.
     *
     * @param {string} token - The JWT to validate
     * @returns {Promise<Object|null>} Decoded payload if valid, null otherwise
     */
    async validateToken(token) {
        try {
            const jwks = await this.getJWKS();

            // Decode the JWT header to find the key ID (kid)
            const decoded = jwt.decode(token, { complete: true });
            if (!decoded || !decoded.header) {
                throw new Error('Unable to decode JWT header.');
            }

            const { kid } = decoded.header;

            // Find the matching JWK by kid
            let jwk = jwks.find(key => key.kid === kid);

            // If key not found, JWKS might have rotated — refetch once
            if (!jwk) {
                this._jwksCache = null; // Force refetch
                const freshJwks = await this.getJWKS();
                jwk = freshJwks.find(key => key.kid === kid);
            }

            if (!jwk) {
                throw new Error(`No matching JWK found for kid: ${kid}`);
            }

            // Convert JWK to PEM and verify
            const publicKey = jwkToPem(jwk);
            const payload = jwt.verify(token, publicKey, {
                algorithms: ['RS256'],
            });

            return payload;
        } catch (error) {
            console.error('❌ Token validation failed:', error.message);
            return null;
        }
    }
}

// Export a singleton instance — one per process, caches shared
const oauth2Client = new OAuth2Client();

module.exports = { OAuth2Client, oauth2Client };
