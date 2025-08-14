# Backend Testing Guide

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Server will start on:** `http://localhost:4000`

3. **Health check:** `http://localhost:4000/health`

## 🔐 Authentication Endpoints

### 1. User Registration (Signup)

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "role": "user"
}
```

**Curl Command:**
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "1234567890",
    "role": "user"
  }'
```

**Driver Registration:**
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Driver Smith",
    "email": "driver@example.com",
    "password": "password123",
    "phone": "9876543210",
    "role": "driver"
  }'
```

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Curl Command:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers Required:**
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

**Curl Command:**
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. User Logout

**Endpoint:** `POST /api/auth/logout`

**Headers Required:**
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

**Curl Command:**
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Testing Workflow

### Step 1: Register a User
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "Test User",
      "email": "test@example.com",
      "phone": "1234567890",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

### Step 2: Login with the User
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Step 3: Use the Token for Authenticated Requests
```bash
# Copy the token from the login response
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Step 4: Test Role-Based Access
```bash
# Try accessing admin-only endpoint (should fail for regular user)
curl -X GET http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

## 🔒 Security Features

- **Password Hashing:** bcrypt with 10 salt rounds
- **JWT Tokens:** Signed with environment variable
- **HTTP-Only Cookies:** Secure cookie storage
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **CORS Protection:** Configured for frontend origin
- **Helmet Security:** Various security headers
- **Input Validation:** Request body validation

## 🐛 Troubleshooting

### Common Issues:

1. **"DATABASE_URL environment variable is not defined"**
   - Copy `.env.example` to `.env` and fill in your MongoDB URL

2. **"JWT_SECRET environment variable is not defined"**
   - Add `JWT_SECRET=your_secret_key` to your `.env` file

3. **"MongoDB connection failed"**
   - Ensure MongoDB is running
   - Check your connection string

4. **"CORS error"**
   - Verify `NEXT_PUBLIC_API_URL` in your `.env` file
   - Check if frontend is running on the expected port

### Environment Variables Required:
```bash
DATABASE_URL=mongodb://localhost:27017/uber-clone
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
PORT_BACKEND=4000
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

## 📱 Frontend Integration

The backend is configured to work with the Next.js frontend:

- **CORS:** Allows requests from `NEXT_PUBLIC_API_URL`
- **Cookies:** HTTP-only cookies for secure token storage
- **Headers:** Accepts Authorization Bearer tokens
- **Rate Limiting:** Prevents abuse while allowing normal usage

## 🚧 Next Steps

After testing authentication:

1. **Add User Management:** Profile updates, password changes
2. **Add Driver Features:** Vehicle details, availability
3. **Add Ride Management:** Booking, tracking, completion
4. **Add Payment Integration:** Razorpay integration
5. **Add Real-time Features:** Socket.IO for live updates
