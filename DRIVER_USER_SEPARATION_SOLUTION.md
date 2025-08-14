# Driver-User Separation Solution

## Problem Statement
The user reported that when creating a driver signup, the same email was being stored in both the User collection and Driver collection in MongoDB. This caused data duplication and confusion.

## Solution Implemented

### 1. **Separate Signup Endpoints**
- **`POST /api/auth/signup`** - For regular users and admins only
- **`POST /api/auth/driver-signup`** - For drivers only

### 2. **Independent Data Storage**
- **Users**: Stored ONLY in the `User` collection
- **Drivers**: Stored ONLY in the `Driver` collection
- **No cross-references**: Drivers no longer reference User documents

### 3. **Updated Driver Model**
```typescript
// Before: Driver had userId reference to User
interface IDriver {
  userId: mongoose.Types.ObjectId; // ❌ This caused the issue
  licenseNumber: string;
  // ... other fields
}

// After: Driver is completely independent
interface IDriver {
  name: string;           // ✅ Direct storage
  email: string;          // ✅ Direct storage
  password: string;       // ✅ Direct storage
  phone: string;          // ✅ Direct storage
  licenseNumber: string;
  // ... other fields
}
```

### 4. **Authentication Flow**
```typescript
// Login checks both collections
export const login = async (req: Request, res: Response) => {
  // First check User collection
  let user = await User.findOne({ email });
  
  // If not found, check Driver collection
  if (!user) {
    const driver = await Driver.findOne({ email });
    if (driver) {
      user = driver as any; // Convert to user-like object
      isDriver = true;
    }
  }
  
  // Authenticate and return appropriate response
}
```

## API Endpoints

### User Signup
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "role": "user"  // or "admin"
}
```

### Driver Signup
```bash
POST /api/auth/driver-signup
Content-Type: application/json

{
  "name": "Driver Smith",
  "email": "driver@example.com",
  "password": "password123",
  "phone": "9876543210",
  "licenseNumber": "DL123456",
  "vehicleType": "sedan",
  "vehicleModel": "Toyota Camry",
  "vehicleNumber": "ABC123"
}
```

## Key Benefits

✅ **Complete Separation**: Drivers and users are stored in different collections
✅ **No Duplication**: Same email won't exist in both collections
✅ **Independent Authentication**: Both can login through the same endpoint
✅ **Role-Based Access**: Proper role checking and authorization
✅ **Password Reset**: Both users and drivers can reset passwords
✅ **Clean Architecture**: Clear separation of concerns

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: "John Doe",
  email: "john@example.com",
  password: "hashed_password",
  phone: "1234567890",
  role: "user",  // or "admin"
  // ... other user fields
}
```

### Driver Collection
```javascript
{
  _id: ObjectId,
  name: "Driver Smith",
  email: "driver@example.com",
  password: "hashed_password",
  phone: "9876543210",
  licenseNumber: "DL123456",
  vehicleType: "sedan",
  vehicleModel: "Toyota Camry",
  vehicleNumber: "ABC123",
  // ... other driver fields
}
```

### DriverProfile Collection
```javascript
{
  _id: ObjectId,
  driverId: ObjectId,  // References Driver, not User
  status: "PENDING",
  documentsVerified: false,
  backgroundCheckPassed: false,
  // ... approval fields
}
```

## Testing

Run the test script to verify the separation:
```bash
cd backend
node test-driver-separation.js
```

This will:
1. Create a regular user
2. Create a driver
3. Verify they're in separate collections
4. Test authentication for both
5. Confirm no cross-contamination

## Migration Notes

If you have existing data where drivers reference User documents:

1. **Backup your database first**
2. **Create new Driver documents** with the driver's information
3. **Update any references** from `userId` to the new driver `_id`
4. **Remove old User documents** that were only used for drivers
5. **Update your application code** to use the new structure

## Security Considerations

- **Password Hashing**: Both users and drivers use bcrypt with salt rounds
- **JWT Tokens**: Proper role-based token generation
- **Input Validation**: Comprehensive validation for all fields
- **Rate Limiting**: Applied to prevent abuse
- **HTTP-Only Cookies**: Secure token storage

## Future Enhancements

- **Email Verification**: Add email verification for both users and drivers
- **Two-Factor Authentication**: Implement 2FA for enhanced security
- **Audit Logging**: Track all authentication and profile changes
- **Profile Pictures**: Add support for profile images in both models
