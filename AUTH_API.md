# Authentication API Documentation

## Overview
The authentication system supports two user roles:
- **Consumer** (previously called "customer") - Can place orders and purchase products
- **Farmer** - Can add and manage products

## Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Signup Consumer
**POST** `/api/auth/signup/consumer`

Creates a new consumer account.

**Request Body:**
```json
{
  "firstName": "John",
  "middleName": "Middle",  // Optional
  "lastName": "Doe",        // Optional
  "email": "john@example.com",
  "phone": "9841234567",
  "province": "Bagmati",
  "city": "Kathmandu",
  "street": "New Road",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Consumer signup successful",
  "token": "jwt_token_here",
  "user": {
    "userId": "user_id",
    "role": "consumer",
    "name": "John Middle Doe",
    "email": "john@example.com"
  }
}
```

#### 2. Signup Farmer
**POST** `/api/auth/signup/farmer`

Creates a new farmer account.

**Request Body:** (Same as consumer signup)

**Response:**
```json
{
  "message": "Farmer signup successful",
  "token": "jwt_token_here",
  "user": {
    "userId": "user_id",
    "role": "farmer",
    "name": "Farmer Name",
    "email": "farmer@example.com"
  }
}
```

#### 3. Login
**POST** `/api/auth/login`

Login for both farmers and consumers.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "userId": "user_id",
    "role": "consumer" | "farmer",
    "name": "User Name",
    "email": "user@example.com",
    "phone": "9841234567",
    "address": {
      "province": "Bagmati",
      "city": "Kathmandu",
      "street": "New Road"
    }
  }
}
```

**Errors:**
- `400` - Missing email or password
- `401` - Invalid email or password

#### 4. Verify Token
**GET** `/api/auth/verify`

Verify if a token is valid (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "userId": "user_id",
    "role": "consumer",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

---

### Protected Endpoints (Authentication Required)

All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

#### 5. Get Current User Profile
**GET** `/api/auth/me`

Get the current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "userId": "user_id",
    "role": "consumer" | "farmer",
    "name": "User Name",
    "email": "user@example.com",
    "phone": "9841234567",
    "firstName": "John",
    "middleName": "Middle",
    "lastName": "Doe",
    "address": {
      "province": "Bagmati",
      "city": "Kathmandu",
      "street": "New Road"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 6. Update Password
**PUT** `/api/auth/password`

Update the current user's password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

**Errors:**
- `400` - Missing passwords or new password too short
- `401` - Current password incorrect

#### 7. Update Profile
**PUT** `/api/auth/profile`

Update the current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (All fields optional)
```json
{
  "firstName": "John",
  "middleName": "Middle",
  "lastName": "Doe",
  "phone": "9841234567",
  "province": "Bagmati",
  "city": "Kathmandu",
  "street": "New Road"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    // Updated user object
  }
}
```

---

## Validation Rules

1. **Email**: Must be a valid email format
2. **Password**: Minimum 6 characters
3. **First Name**: Required
4. **Phone**: Required

---

## JWT Token

- **Expiration**: 7 days
- **Payload**: Contains `userId`, `role`, `name`, `email`
- **Header Format**: `Authorization: Bearer <token>`

---

## Role-Based Access Control

### Consumer Role
- Can place orders
- Can view products
- Can update own profile

### Farmer Role
- Can add products
- Can view products
- Can update own profile

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "message": "Error message here",
  "errors": ["Error detail 1", "Error detail 2"]  // For validation errors
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid token or credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## Legacy Support

The endpoint `/api/auth/signup/customer` still works for backward compatibility but creates a user with the "consumer" role.

