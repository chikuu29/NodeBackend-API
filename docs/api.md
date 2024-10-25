# API Documentation: Register API

## Base URL:

`https://backend/`

## Endpoints: `https://backend/v1/oauth/register`

### 1. Google Sign-In Register

**Endpoint:** `GET v1/oauth/register/google`

**Description:** Registers a user using Google OAuth.

**Summary:** This Request is redirected to google oauth screen once user sign in with their account then
return back to our backed server 

**Endpoint:** `GET v1/oauth/register/google/callback`


**Summary:** then we will retrive user infomation and store it in our database  after that we redirected to frontend url with the token set in cookie

`NOTE:note sign it with google does't required to OTP Process`   

`Response:`


### Redirected URL: http://frontend/auth/setup_business




### Success (201 Created):

```json
{
  "message": "Account Creation successful",
  "success": true,
  "authProvider": "MANUAL_REGISTER_MODE" | "GOOGLE_OAUTH_MODE" ,
  "login_info": {
    "userFullName": "SURYANARAYAN BISWAL",
    "role": "user",
    "email": "cchiku1999@gmail.com",
    "phone": "8327783629",
    "image": null,
    "firstName": "SURYANARAYAN",
    "lastName": "BISWAL"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoUHJvdmlkZXIiOiJNQU5VQUxfTE9HSU5fTU9ERSIsInVzZXJOYW1lIjoiU1VSWUFOQVJBWUFOIEJJU1dBTCIsImZpcnN0TmFtZSI6IlNVUllBTkFSQVlBTiIsImxhc3ROYW1lIjoiQklTV0FMIiwiaW1hZ2UiOm51bGwsImVtYWlsIjoiY2NoaWt1MTk5OUBnbWFpbC5jb20iLCJwaG9uZSI6IjgzMjc3ODM2MjkiLCJyb2xlIjoidXNlciIsImV4cCI6MTcyOTgyOTQyMywiaWF0IjoxNzI5ODI1ODIzfQ.k7-tXow-PGxmRsm6fxvYWBL6J5HBxwyFHy6BnCv8zAc"
}
```

`Error (400 Bad Request):`

```json
{
  "status": "error",
  "message": "Invalid Google token"
}
```

2. Manual Register with OTP
   Endpoint: POST /register/manual

### Description: Registers a user using their phone number or email, with OTP verification.

### Request:

Headers:

Content-Type: application/json
Body (JSON):

json
Copy code
{
"emailOrPhone": "user@example.com or phone number"
}
Response:

Success (200 OK):

```json
{
  "status": "success",
  "message": "OTP sent successfully"
}
```

Error (400 Bad Request):

json
Copy code
{
"status": "error",
"message": "Invalid email or phone number"
}

````

```

```
````

3. Verify OTP
   Endpoint: POST /register/verify-otp

Description: Verifies the OTP sent to the user and completes registration.

Request:

Headers:

Content-Type: application/json
Body (JSON):

{
"emailOrPhone": "user@example.com or phone number",
"otp": "123456"
}
