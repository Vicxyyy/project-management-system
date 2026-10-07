# Authentication API Documentation

> Base URL: `http://localhost:5000`  
> Auth prefix: `/api/auth`  
> Content-Type: `application/json`

---

## Overview

All auth endpoints live at `/api/auth/*` (no version prefix — required by assignment).

| Method | URL                   | Auth Required | Description             |
|--------|-----------------------|---------------|-------------------------|
| POST   | /api/auth/register    | ❌ No          | Create a new account    |
| POST   | /api/auth/login       | ❌ No          | Authenticate a user     |
| POST   | /api/auth/logout      | ❌ No          | Client-side logout      |
| GET    | /api/auth/me          | ✅ Yes (JWT)   | Get current user        |

---

## Authentication Scheme

Protected endpoints require a JWT in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are issued at registration and login. They are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default: 7 days).

The token payload contains only `sub` (user ID). **Passwords are never stored in plaintext and never returned in any response.**

---

## Rate Limiting

Registration and Login endpoints are rate-limited to **10 requests per IP per 15 minutes**. Exceeding this returns HTTP 429.

---

## 1. Register

**POST /api/auth/register**  
**Authentication:** Not required  
**Rate limited:** Yes

### Request Body

| Field    | Type   | Required | Rules                                                                 |
|----------|--------|----------|-----------------------------------------------------------------------|
| fullName | string | ✅        | 2–100 characters, trimmed                                             |
| email    | string | ✅        | Valid email format. Normalized to lowercase before storage.           |
| password | string | ✅        | 8–128 chars, must contain uppercase, lowercase, digit, special char   |

```json
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "password": "Secure123!"
}
```

### Success Response — `201 Created`

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "clxyz123",
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "createdAt": "2026-10-07T00:00:00.000Z",
      "updatedAt": "2026-10-07T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

### Error Responses

| Status | Condition                        | Message example                              |
|--------|----------------------------------|----------------------------------------------|
| 400    | Missing or invalid field         | "Full name is required"                      |
| 400    | Invalid email format             | "Please provide a valid email address"       |
| 400    | Weak password                    | "Password must contain at least one uppercase letter" |
| 409    | Email already registered         | "An account with this email already exists"  |
| 429    | Too many requests                | "Too many attempts. Please try again in 15 minutes." |

```json
{
  "success": false,
  "message": "An account with this email already exists"
}
```

---

## 2. Login

**POST /api/auth/login**  
**Authentication:** Not required  
**Rate limited:** Yes

### Request Body

| Field    | Type   | Required |
|----------|--------|----------|
| email    | string | ✅        |
| password | string | ✅        |

```json
{
  "email": "jane@example.com",
  "password": "Secure123!"
}
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clxyz123",
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "createdAt": "2026-10-07T00:00:00.000Z",
      "updatedAt": "2026-10-07T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

### Error Responses

| Status | Condition                         | Message                          |
|--------|-----------------------------------|----------------------------------|
| 400    | Missing email or password         | "Email is required"              |
| 401    | Invalid credentials               | "Invalid email or password"      |
| 429    | Too many requests                 | "Too many attempts..."           |

> **Security note:** The same generic "Invalid email or password" message is returned for both "email not found" and "wrong password" to prevent user enumeration attacks. Bcrypt is always run (even for unknown emails) to prevent timing attacks.

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 3. Logout

**POST /api/auth/logout**  
**Authentication:** Not required  
**Rate limited:** No

### Behavior

This API uses **stateless JWTs**. The server does not maintain a token store, so it cannot invalidate a specific token. Logout is a client-side operation — the client must delete the stored token.

This endpoint exists to:
- Provide a clean contract for clients
- Allow future server-side token revocation (e.g., Redis blacklist) without changing the API surface

### Request Body

None required.

### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully. Please remove the token from your client."
}
```

---

## 4. Get Current User

**GET /api/auth/me**  
**Authentication:** ✅ Required — `Authorization: Bearer <token>`  
**Rate limited:** No

### Headers

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxyz123",
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "createdAt": "2026-10-07T00:00:00.000Z",
      "updatedAt": "2026-10-07T00:00:00.000Z"
    }
  }
}
```

### Error Responses

| Status | Condition                  | Message                              |
|--------|----------------------------|--------------------------------------|
| 401    | No token provided          | "No authentication token provided"   |
| 401    | Invalid token              | "Invalid token"                      |
| 401    | Token expired              | "Token has expired"                  |
| 404    | User deleted after token issued | "User not found"               |

```json
{
  "success": false,
  "message": "No authentication token provided"
}
```

---

## Security Notes

- `passwordHash` is **never** returned in any API response
- Stack traces are **never** included in production responses
- JWT secret is loaded from `JWT_SECRET` environment variable — never hardcoded
- Emails are normalized to lowercase before storage and lookup
- bcrypt rounds: 12

---

## Using the API — cURL Examples

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Jane Smith","email":"jane@example.com","password":"Secure123!"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Secure123!"}'

# Get current user (replace TOKEN)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Logout
curl -X POST http://localhost:5000/api/auth/logout
```
