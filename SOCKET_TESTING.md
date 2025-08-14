# Socket.IO & Ride Management Testing Guide

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Server will start on:** `http://localhost:4000`

3. **Socket.IO will be available on:** `ws://localhost:4000`

## 🔌 Socket.IO Testing

### Using a WebSocket Client (like wscat or browser console)

#### 1. Driver Connection & Location Updates

**Connect as a driver:**
```javascript
// In browser console or WebSocket client
const socket = io('http://localhost:4000');

// Driver joins with location
socket.emit('driver:join', {
  driverId: 'your_driver_user_id',
  lat: 12.9716,
  lng: 77.5946
});

// Listen for join confirmation
socket.on('driver:joined', (data) => {
  console.log('Driver joined:', data);
});

// Update driver location
socket.emit('driver:location', {
  driverId: 'your_driver_user_id',
  lat: 12.9716,
  lng: 77.5946
});

// Listen for location updates from other drivers
socket.on('driver:location', (data) => {
  console.log('Driver location update:', data);
});
```

#### 2. User Ride Subscription

**Connect as a user:**
```javascript
const socket = io('http://localhost:4000');

// Subscribe to a specific ride
socket.emit('user:subscribeRide', {
  userId: 'your_user_id',
  rideId: 'ride_id_here'
});

// Listen for subscription confirmation
socket.on('user:subscribed', (data) => {
  console.log('Subscribed to ride:', data);
});

// Listen for ride status updates
socket.on('ride:status', (data) => {
  console.log('Ride status update:', data);
});

// Listen for ride acceptance
socket.on('ride:accepted', (data) => {
  console.log('Ride accepted:', data);
});

// Subscribe to nearby drivers
socket.emit('user:subscribeNearby', {
  userId: 'your_user_id',
  lat: 12.9716,
  lng: 77.5946
});

socket.on('user:nearby_subscribed', (data) => {
  console.log('Subscribed to nearby drivers:', data);
});
```

## 🚗 Ride Management Endpoints

### 1. Request a Ride

**Endpoint:** `POST /api/rides/request`

**Headers Required:**
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "pickupLocation": "123 Main St, City",
  "dropLocation": "456 Oak Ave, City",
  "pickupLat": 12.9716,
  "pickupLng": 77.5946,
  "dropLat": 12.9789,
  "dropLng": 77.5917,
  "estimatedFare": 150,
  "distanceKm": 2.5
}
```

**Curl Command:**
```bash
curl -X POST http://localhost:4000/api/rides/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "pickupLocation": "123 Main St, City",
    "dropLocation": "456 Oak Ave, City",
    "pickupLat": 12.9716,
    "pickupLng": 77.5946,
    "dropLat": 12.9789,
    "dropLng": 77.5917,
    "estimatedFare": 150,
    "distanceKm": 2.5
  }'
```

### 2. Get Ride Details

**Endpoint:** `GET /api/rides/:id`

**No authentication required**

**Curl Command:**
```bash
curl -X GET http://localhost:4000/api/rides/RIDE_ID_HERE
```

### 3. Cancel a Ride

**Endpoint:** `POST /api/rides/:id/cancel`

**Headers Required:**
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

**Curl Command:**
```bash
curl -X POST http://localhost:4000/api/rides/RIDE_ID_HERE/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Update Ride Status (Driver Only)

**Endpoint:** `POST /api/rides/:id/status`

**Headers Required:**
```bash
Authorization: Bearer DRIVER_JWT_TOKEN
```

**Request Body:**
```json
{
  "status": "on_the_way"
}
```

**Valid Status Transitions:**
- `accepted` → `on_the_way`
- `on_the_way` → `arrived`
- `arrived` → `in_progress`
- `in_progress` → `completed`

**Curl Command:**
```bash
curl -X POST http://localhost:4000/api/rides/RIDE_ID_HERE/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DRIVER_JWT_TOKEN" \
  -d '{"status": "on_the_way"}'
```

## 👨‍💼 Driver Management Endpoints

### 1. Get Driver Profile

**Endpoint:** `GET /api/driver/profile`

**Headers Required:**
```bash
Authorization: Bearer DRIVER_JWT_TOKEN
```

**Curl Command:**
```bash
curl -X GET http://localhost:4000/api/driver/profile \
  -H "Authorization: Bearer DRIVER_JWT_TOKEN"
```

### 2. Update Driver Profile

**Endpoint:** `PUT /api/driver/profile`

**Headers Required:**
```bash
Authorization: Bearer DRIVER_JWT_TOKEN
```

**Request Body:**
```json
{
  "vehicleType": "suv",
  "isAvailable": true
}
```

**Curl Command:**
```bash
curl -X PUT http://localhost:4000/api/driver/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DRIVER_JWT_TOKEN" \
  -d '{
    "vehicleType": "suv",
    "isAvailable": true
  }'
```

### 3. Accept a Ride

**Endpoint:** `POST /api/driver/accept/:rideId`

**Headers Required:**
```bash
Authorization: Bearer DRIVER_JWT_TOKEN
```

**Curl Command:**
```bash
curl -X POST http://localhost:4000/api/driver/accept/RIDE_ID_HERE \
  -H "Authorization: Bearer DRIVER_JWT_TOKEN"
```

### 4. Get Driver Ride History

**Endpoint:** `GET /api/driver/rides`

**Headers Required:**
```bash
Authorization: Bearer DRIVER_JWT_TOKEN
```

**Curl Command:**
```bash
curl -X GET http://localhost:4000/api/driver/rides \
  -H "Authorization: Bearer DRIVER_JWT_TOKEN"
```

## 🧪 Complete Testing Workflow

### Step 1: Create Test Users

```bash
# Create a regular user
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "user@test.com",
    "password": "password123",
    "phone": "1234567890"
  }'

# Create a driver
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Driver",
    "email": "driver@test.com",
    "password": "password123",
    "phone": "9876543210",
    "role": "driver"
  }'
```

### Step 2: Login and Get Tokens

```bash
# Login as user
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123"
  }'

# Login as driver
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@test.com",
    "password": "password123"
  }'
```

### Step 3: Test Ride Flow

```bash
# 1. User requests a ride
USER_TOKEN="your_user_token_here"
curl -X POST http://localhost:4000/api/rides/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "pickupLocation": "123 Main St, City",
    "dropLocation": "456 Oak Ave, City",
    "pickupLat": 12.9716,
    "pickupLng": 77.5946,
    "dropLat": 12.9789,
    "dropLng": 77.5917,
    "estimatedFare": 150,
    "distanceKm": 2.5
  }'

# 2. Driver accepts the ride
DRIVER_TOKEN="your_driver_token_here"
RIDE_ID="ride_id_from_step_1"
curl -X POST http://localhost:4000/api/driver/accept/$RIDE_ID \
  -H "Authorization: Bearer $DRIVER_TOKEN"

# 3. Driver updates ride status
curl -X POST http://localhost:4000/api/rides/$RIDE_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DRIVER_TOKEN" \
  -d '{"status": "on_the_way"}'
```

## 🔒 Socket.IO Security Notes

- **Current Implementation**: Basic socket connection without authentication
- **Production Recommendation**: Implement JWT token validation for socket connections
- **Redis Adapter**: For production scaling across multiple server instances

## 🐛 Troubleshooting

### Common Issues:

1. **Socket connection fails**
   - Check if server is running on correct port
   - Verify CORS settings in Socket.IO configuration

2. **Events not received**
   - Ensure correct room names are used
   - Check socket connection status

3. **Driver not receiving ride requests**
   - Verify driver has joined the 'drivers' room
   - Check if driver is marked as available

4. **User not receiving updates**
   - Ensure user has subscribed to the correct ride room
   - Verify socket connection is active

## 📱 Frontend Integration

The Socket.IO implementation is ready for frontend integration:

- **Real-time ride updates** for users
- **Live driver location** tracking
- **Instant ride acceptance** notifications
- **Status change broadcasts** to all ride participants

## 🚧 Next Steps

After testing the basic functionality:

1. **Implement geospatial filtering** for nearby drivers
2. **Add JWT authentication** to socket connections
3. **Implement Redis adapter** for production scaling
4. **Add ride rating system**
5. **Implement payment integration**
