# OAuth 2.0 + OpenID Connect — Integration Guide

> **Auth Server Base URL:** `http://localhost:8000` (dev) or your production domain.
>
> **Discovery Endpoint:** `GET /.well-known/openid-configuration`

---

## Flow Overview

This server implements the **Authorization Code Flow with PKCE** (RFC 7636) — the most secure OAuth2 flow for web and mobile apps.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AUTHORIZATION CODE FLOW                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────┐     1. Redirect to /oauth2/authorize      ┌──────────────┐  │
│  │  Your    │ ──────────────────────────────────────────▶ │  Auth Server │  │
│  │  React   │                                            │  Login Page  │  │
│  │  App     │ ◀────────────────────────────────────────── │              │  │
│  │          │     2. Redirect back with ?code=xxx         │              │  │
│  └──────┬───┘                                            └──────────────┘  │
│         │                                                                  │
│         │  3. POST /oauth2/token                                           │
│         │     (code + client_secret + code_verifier)                       │
│         ▼                                                                  │
│  ┌──────────┐     4. { access_token, refresh_token, id_token }             │
│  │  Your    │ ◀─────────────────────────────────────────────────────────── │
│  │  Backend │                                                              │
│  │          │     5. GET /oauth2/userinfo (Bearer token)                    │
│  │          │ ──────────────────────────────────────────────────────────▶  │
│  │          │ ◀── { sub, name, email, roles, permissions, tenant }        │
│  └──────────┘                                                              │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Integration

### Prerequisites

1. **Register an OAuth Client** on the Auth Server dashboard.
2. Note down your:
   - `client_id`
   - `client_secret`
   - `redirect_url` (must match exactly)
   - Allowed `scopes` (e.g., `openid profile email roles`)

---

### Step 1 — Redirect User to Login

From your frontend, redirect the user to the Auth Server's `/oauth2/authorize` endpoint:

```
GET {AUTH_SERVER}/oauth2/authorize
    ?client_id=YOUR_CLIENT_ID
    &redirect_url=http://localhost:3000/callback
    &response_type=code
    &scope=openid profile email roles
    &state=RANDOM_STATE_STRING
    &code_challenge=BASE64URL_SHA256_OF_VERIFIER
    &code_challenge_method=S256
```

#### Query Parameters

| Param | Required | Description |
|-------|----------|-------------|
| `client_id` | ✅ | Your registered client ID |
| `redirect_url` | ✅ | Must match a registered redirect URL |
| `response_type` | ✅ | Always `code` |
| `scope` | ✅ | Space-separated scopes (see below) |
| `state` | Recommended | Random string to prevent CSRF |
| `code_challenge` | Recommended | PKCE challenge (SHA-256 of verifier, base64url-encoded) |
| `code_challenge_method` | Recommended | `S256` (recommended) or `plain` |
| `device_id` | Optional | Unique device identifier for device binding |

#### Generating PKCE Values (JavaScript)

```javascript
// 1. Generate a random code_verifier
function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// 2. Generate code_challenge from verifier
async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Usage:
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);
// Store codeVerifier in sessionStorage for Step 2
sessionStorage.setItem('code_verifier', codeVerifier);
```

#### Available Scopes

| Scope | Data Returned |
|-------|---------------|
| `openid` | `sub`, `name`, `email`, `roles`, `permissions`, `tenant`, `profile` |
| `profile` | `name`, `first_name`, `last_name`, `phone_number`, `tenant`, `profile` |
| `email` | `email` |
| `roles` | `roles[]`, `permissions[]` |

---

### Step 2 — Handle the Callback

After the user logs in and consents, the Auth Server redirects back to your `redirect_url`:

```
http://localhost:3000/callback?code=AUTH_CODE_HERE&state=YOUR_STATE
```

**In your callback handler:**

1. Verify `state` matches what you sent in Step 1.
2. Extract the `code` from the query params.
3. Exchange it for tokens (Step 3).

```javascript
// React callback component
function OAuthCallback() {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');

        if (error) {
            console.error('OAuth error:', error);
            return;
        }

        // Verify state
        if (state !== sessionStorage.getItem('oauth_state')) {
            console.error('State mismatch — possible CSRF attack');
            return;
        }

        // Exchange code for tokens
        exchangeCodeForTokens(code);
    }, []);
}
```

---

### Step 3 — Exchange Code for Tokens

**From your backend** (never from the frontend — `client_secret` must stay private):

```
POST {AUTH_SERVER}/oauth2/token
Content-Type: application/json

{
    "grant_type": "authorization_code",
    "code": "AUTH_CODE_FROM_STEP_2",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uri": "http://localhost:3000/callback",
    "code_verifier": "STORED_CODE_VERIFIER",
    "device_id": "OPTIONAL_DEVICE_ID"
}
```

#### Response

```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "refresh_token": "xR3kL7mN2pQ5sT8vW...",
    "id_token": "eyJhbGciOiJSUzI1NiIs...",
    "refresh_exp": "2026-03-19T09:00:00Z",
    "login_info": {
        "sub": "johndoe",
        "email": "john@example.com",
        "username": "johndoe",
        "userFullName": "John Doe",
        "tenant_name": "AcmeCorp"
    },
    "success": true,
    "message": "Token exchange successful."
}
```

#### Token Lifetimes

| Token | Lifetime | Purpose |
|-------|----------|---------|
| `access_token` | 15 minutes | API authorization (RS256 JWT) |
| `id_token` | 1 hour | User identity (RS256 JWT) |
| `refresh_token` | 15 days | Get new access tokens (opaque, rotated) |

---

### Step 4 — Get User Info

Call the **UserInfo endpoint** with the access token to get the full user profile:

```
GET {AUTH_SERVER}/oauth2/userinfo
Authorization: Bearer ACCESS_TOKEN_HERE
```

#### Response

```json
{
    "sub": "johndoe",
    "name": "John Doe",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "+91-9876543210",
    "is_active": true,
    "tenant": {
        "id": 1,
        "tenant_uuid": "550e8400-e29b-41d4-a716-446655440000",
        "tenant_name": "AcmeCorp",
        "tenant_email": "admin@acmecorp.com",
        "is_active": true,
        "status": "active",
        "deployment_type": "shared"
    },
    "profile": {
        "bio": "Software Engineer",
        "profile_picture": "https://...",
        "address": "123 Main St",
        "city": "Bangalore",
        "country": "India"
    },
    "roles": ["admin", "editor"],
    "permissions": [
        {
            "id": 1,
            "permission_name": "users",
            "scopes": ["read", "write", "edit"],
            "description": "Manage users"
        }
    ]
}
```

---

### Step 5 — Refresh the Access Token

When the access token expires (15 min), use the refresh token to get a new one.

> **⚠️ CRITICAL:** The refresh token **rotates** on every use. You MUST save the new `refresh_token` from the response to replace the old one.

```
POST {AUTH_SERVER}/oauth2/token
Content-Type: application/json

{
    "grant_type": "refresh_token",
    "refresh_token": "CURRENT_REFRESH_TOKEN",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "device_id": "OPTIONAL_DEVICE_ID",
    "rotate": false
}
```

> **💡 Optimization:** If you set `"rotate": false`, the server will only return a new `access_token` and keep the current `refresh_token` active. This is recommended if your access tokens have very short lifetimes (e.g., 30 seconds) to avoid excessive rotation.

#### Response

```json
{
    "access_token": "eyJhbG...(NEW)...",
    "refresh_token": "null (if rotate: false) or a new token",
    "id_token": "eyJhbG...(NEW)...",
    "refresh_exp": "2026-03-19T09:00:00Z",
    "success": true,
    "message": "Token refreshed successfully."
}
```

#### Refresh Token Rules

| Rule | Detail |
|------|--------|
| **Single-use** | If `rotate: true` (default), each token works exactly once |
| **Optional Rotation** | Set `rotate: false` to reuse the same refresh token |
| **Device-bound** | Token is tied to the device fingerprint |
| **Grace period** | 30s window for retries (e.g., React StrictMode double-calls) |
| **Theft detection** | Replaying a used token (after 30s) revokes ALL tokens for that user+client |

---

## Access Token JWT Claims

The access token is an RS256-signed JWT. You can verify it using the JWKS endpoint.

```json
{
    "iss": "http://localhost:8000",
    "sub": "johndoe",
    "aud": "YOUR_CLIENT_ID",
    "iat": 1709524800,
    "exp": 1709525700,
    "jti": "unique-token-id",
    "token_type": "access_token",
    "client_id": "YOUR_CLIENT_ID",
    "tenant_name": "AcmeCorp",
    "scope": ["openid", "profile", "email", "roles"],
    "roles": ["admin"],
    "permissions": [{"permission_name": "users", "scopes": ["read", "write"]}]
}
```

### Verifying the Token (JWKS)

```
GET {AUTH_SERVER}/.well-known/jwks.json
```

Use the `kid` from the JWT header to find the matching public key in the JWKS response. Verify with RS256 algorithm.

---

## Full React Integration Example

```javascript
// ── config.js ──────────────────────────────────────────────
const AUTH_SERVER = 'http://localhost:8000';
const CLIENT_ID = 'your-client-id';
const CLIENT_SECRET = 'your-client-secret';  // Keep in backend only!
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = 'openid profile email roles';

// ── Login Button ───────────────────────────────────────────
async function startOAuthLogin() {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = crypto.randomUUID();

    // Store for callback verification
    sessionStorage.setItem('code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_url: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPES,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    window.location.href = `${AUTH_SERVER}/oauth2/authorize?${params}`;
}

// ── Callback Handler ───────────────────────────────────────
async function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    // Verify state
    if (state !== sessionStorage.getItem('oauth_state')) {
        throw new Error('State mismatch');
    }

    // Exchange code for tokens (do this from YOUR backend in production!)
    const response = await fetch(`${AUTH_SERVER}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code: code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code_verifier: sessionStorage.getItem('code_verifier'),
        }),
    });

    const tokens = await response.json();

    if (tokens.success) {
        // Store tokens securely
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);

        // Fetch user info
        const userInfo = await fetchUserInfo(tokens.access_token);
        console.log('User:', userInfo);
    }
}

// ── Fetch User Info ────────────────────────────────────────
async function fetchUserInfo(accessToken) {
    const response = await fetch(`${AUTH_SERVER}/oauth2/userinfo`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    return await response.json();
}

// ── Refresh Token ──────────────────────────────────────────
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    const response = await fetch(`${AUTH_SERVER}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        }),
    });

    const data = await response.json();

    if (data.success) {
        localStorage.setItem('access_token', data.access_token);
        // ⚠️ CRITICAL: Always save the new rotated refresh token!
        if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
        }
        return data.access_token;
    } else {
        // Token expired or revoked — redirect to login
        startOAuthLogin();
    }
}
```

---

### Step 6 — Logout (Third-Party App)

When a user logs out from your app, you should **revoke their refresh token** on the Auth Server so the session can't be reused.

> **⚠️ IMPORTANT:** Use `POST /oauth2/revoke` — NOT `/auth/logout`.
> `/auth/logout` is for the Auth Server's own UI and will kill the user's Auth Server session too!

```
┌──────────────┐                                  ┌──────────────┐
│  Your App    │                                  │  Auth Server │
│              │  1. POST /oauth2/revoke           │              │
│              │  (Bearer token + refresh_token)   │              │
│              │ ────────────────────────────────▶ │  Revokes     │
│              │                                  │  refresh     │
│              │ ◀── { success: true }             │  token in DB │
│              │                                  │              │
│              │  2. Clear local tokens            │  Auth Server │
│              │  3. Redirect to your login page   │  STAYS       │
└──────────────┘                                  │  LOGGED IN ✅│
                                                  └──────────────┘
```

#### Revoke a Specific Refresh Token

```
POST {AUTH_SERVER}/oauth2/revoke
Authorization: Bearer ACCESS_TOKEN_HERE
Content-Type: application/json

{
    "token": "THE_REFRESH_TOKEN_TO_REVOKE"
}
```

Response:

```json
{
    "message": "Token revoked successfully.",
    "success": true
}
```

#### Revoke All Sessions (for this client)

```
POST {AUTH_SERVER}/oauth2/revoke
Authorization: Bearer ACCESS_TOKEN_HERE
Content-Type: application/json

{
    "revoke_all": true
}
```

Response: `{ "message": "All 3 sessions revoked.", "success": true }`

> **Note:** When using `revoke_all`, the server automatically scopes to the `client_id` from your access token — it only revokes sessions for YOUR app, not other apps.

#### What the Server Does

1. **Revokes** the refresh token in the database (marks it with `revoked_at` timestamp)
2. **Does NOT touch cookies** — the Auth Server session is independent
3. The access token will naturally expire after 15 minutes (JWTs can't be revoked server-side)

---

### Logout vs Revoke — Which to Use?

| Endpoint | Use When | Auth Server Session |
|----------|----------|---------------------|
| `POST /oauth2/revoke` | **Third-party app** logging out — your app only | ✅ Stays logged in |
| `POST /auth/logout` | **Auth Server's own UI** logging the user out | ❌ Destroyed (cookies deleted) |

---

### Complete Logout Flow (JavaScript)

```javascript
// ── Third-Party App Logout ─────────────────────────────────
async function logout() {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    // 1. Revoke the refresh token on the Auth Server
    //    (Auth Server session stays alive — independent sessions)
    try {
        await fetch(`${AUTH_SERVER}/oauth2/revoke`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: refreshToken }),
        });
    } catch (err) {
        console.warn('Server revoke failed (token may have expired):', err);
    }

    // 2. Clear all local tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.clear();

    // 3. Redirect to your app's login page
    window.location.href = '/login';
}
```

> **💡 Tip:** Even if the server call fails (e.g., token already expired), always clear local tokens and redirect. The refresh token will expire on its own (15 days max).

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/oauth2/authorize` | Bearer (user login) | Start OAuth flow, get consent |
| `POST` | `/oauth2/grant` | Bearer (user login) | User allows/denies consent |
| `POST` | `/oauth2/token` | Client credentials | Exchange code or refresh token |
| `GET` | `/oauth2/userinfo` | Bearer (access token) | Get user profile, roles, permissions |
| `POST` | `/oauth2/revoke` | Bearer (access token) | **Third-party logout** — revoke refresh token |
| `GET` | `/.well-known/openid-configuration` | None | OpenID discovery metadata |
| `GET` | `/.well-known/jwks.json` | None | Public keys for JWT verification |

---

## Error Handling

### Redirect Errors (returned as query params)

| Error | Meaning |
|-------|---------|
| `access_denied` | User clicked "Deny" |
| `invalid_request` | Missing required parameters |
| `redirect_uri_mismatch` | redirect_url doesn't match registered URL |
| `invalid_state` | State mismatch |
| `timeout` | Consent session expired |

### Token Endpoint Errors (JSON response)

| Error Message | Cause |
|---------------|-------|
| `OAuth session not found or authorization code has expired.` | Code expired or already used |
| `PKCE verification failed.` | code_verifier doesn't match code_challenge |
| `Device ID mismatch detected.` | Different device than the one that started the flow |
| `Refresh token has been revoked. All sessions terminated.` | Used an old/rotated refresh token (possible theft) |
| `Refresh token has expired.` | Refresh token past 15-day lifetime |
