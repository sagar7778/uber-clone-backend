import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Driver, DriverProfile } from '../models';
import crypto from 'crypto';
import { sendMail } from '../utils/mailer';

/**
 * Authentication Controller
 * Handles user registration, login, and logout
 */

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

interface UserSignupBody {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: 'user' | 'admin' | 'driver';
}

interface DriverSignupBody {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'driver';
  // Driver-specific fields (required for driver role)
  licenseNumber: string;
  licenseImage?: string;
  vehicleType: 'sedan' | 'suv' | 'hatchback' | 'bike' | 'auto';
  vehicleModel: string;
  vehicleNumber: string;
  vehicleImage?: string;
  currentLat?: number;
  currentLng?: number;
}

interface LoginBody {
  email: string;
  password: string;
}

/**
 * Generate JWT token
 * @param payload - Token payload
 * @returns JWT token string
 */
const generateToken = (payload: { id: string; role: string; email: string }): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

/**
 * Set HTTP-only cookie with JWT token
 * @param res - Express response object
 * @param token - JWT token
 */
const setAuthCookie = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
};

/**
 * Clear authentication cookie
 * @param res - Express response object
 */
const clearAuthCookie = (res: Response): void => {
  res.clearCookie('auth_token', { path: '/' });
};

/**
 * GET /api/auth/health
 * Health check endpoint for debugging
 */
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    // Test database connection
    const userCount = await User.countDocuments();
    const driverCount = await Driver.countDocuments();
    
    res.status(200).json({
      success: true,
      message: 'Auth service is healthy',
      data: {
        database: 'connected',
        userCount,
        driverCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Auth service is unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * POST /api/auth/signup
 * User registration endpoint (for regular users and admins only)
 * 
 * Test with curl:
 * curl -X POST http://localhost:4000/api/auth/signup \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"John Doe","email":"john@example.com","password":"password123","phone":"1234567890","role":"user"}'
 */
export const signup = async (req: Request<{}, {}, UserSignupBody>, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role = 'user' } = req.body;

    // Only allow user and admin roles through this endpoint
    if (role === 'driver') {
      res.status(400).json({
        success: false,
        message: 'Driver signup should use /api/auth/driver-signup endpoint'
      });
      return;
    }

    console.log('🚀 User signup attempt:', { email, role, name: name.substring(0, 3) + '...' });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with basic info
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role
    });

    console.log('💾 Saving user to database...');
    await user.save();
    console.log('✅ User saved successfully:', user._id);

    // Generate JWT token
    console.log('🔑 Generating JWT token...');
    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email
    });

    // Set HTTP-only cookie
    setAuthCookie(res, token);

    // Return user info (without password) and token
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      defaultPaymentMethod: user.defaultPaymentMethod,
      savedLocations: user.savedLocations
    };

    console.log('🎉 User signup completed successfully for:', email);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('❌ User signup error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('validation failed')) {
        res.status(400).json({
          success: false,
          message: 'Validation failed: ' + error.message
        });
      } else if (error.message.includes('duplicate key')) {
        res.status(400).json({
          success: false,
          message: 'A user with this information already exists'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error during registration: ' + error.message
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }
};

/**
 * POST /api/auth/driver-signup
 * Driver registration endpoint (separate from user signup)
 * 
 * Test with curl:
 * curl -X POST http://localhost:4000/api/auth/driver-signup \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"Driver Name","email":"driver@example.com","password":"password123","phone":"1234567890","licenseNumber":"DL123456","vehicleType":"sedan","vehicleModel":"Toyota Camry","vehicleNumber":"ABC123"}'
 */
export const driverSignup = async (req: Request<{}, {}, DriverSignupBody>, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, licenseNumber, vehicleType, vehicleModel, vehicleNumber, vehicleImage, licenseImage, currentLat, currentLng } = req.body;

    console.log('🚗 Driver signup attempt:', { email, name: name.substring(0, 3) + '...' });

    // Validate required fields
    const requiredFields = { name, email, password, phone, licenseNumber, vehicleType, vehicleModel, vehicleNumber };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        requiredFields: ['name', 'email', 'password', 'phone', 'licenseNumber', 'vehicleType', 'vehicleModel', 'vehicleNumber'],
        optionalFields: ['vehicleImage', 'licenseImage', 'currentLat', 'currentLng']
      });
      return;
    }

    // Check if driver already exists with more specific error messages
    const existingDriverEmail = await Driver.findOne({ email });
    if (existingDriverEmail) {
      console.log('❌ Driver with this email already exists:', email);
      res.status(400).json({ 
        success: false, 
        message: 'A driver with this email already exists' 
      });
      return;
    }

    const existingDriverLicense = await Driver.findOne({ licenseNumber });
    if (existingDriverLicense) {
      console.log('❌ Driver with this license number already exists:', licenseNumber);
      res.status(400).json({ 
        success: false, 
        message: 'A driver with this license number already exists' 
      });
      return;
    }

    const existingDriverVehicle = await Driver.findOne({ vehicleNumber });
    if (existingDriverVehicle) {
      console.log('❌ Driver with this vehicle number already exists:', vehicleNumber);
      res.status(400).json({ 
        success: false, 
        message: 'A driver with this vehicle number already exists' 
      });
      return;
    }

    // Check if user exists (but allow them to become a driver)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('ℹ️ User exists, converting to driver:', email);
      // We'll allow this - user can become a driver
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create driver document directly (no User document for drivers)
    const driver = new Driver({
      name,
      email,
      password: hashedPassword,
      phone,
      licenseNumber,
      licenseImage: licenseImage || 'https://via.placeholder.com/300x200?text=License+Image',
      vehicleType,
      vehicleModel,
      vehicleNumber,
      vehicleImage: vehicleImage || 'https://via.placeholder.com/300x200?text=Vehicle+Image',
      currentLocation: {
        lat: typeof currentLat === 'number' ? currentLat : 0,
        lng: typeof currentLng === 'number' ? currentLng : 0,
        updatedAt: new Date()
      },
      isAvailable: false, // Driver starts as unavailable until they complete setup
      rating: 5, // Default rating
      totalEarnings: 0,
      completedRides: 0
    });
    
    console.log('💾 Saving driver to database...');
    await driver.save();
    console.log('✅ Driver saved successfully:', driver._id);
    
    // Create driver profile for approval process
    const driverProfile = new DriverProfile({
      driverId: driver._id,
      status: 'PENDING',
      documentsVerified: false,
      backgroundCheckPassed: false,
      insuranceValid: false,
      vehicleInspectionPassed: false
    });
    
    console.log('💾 Saving driver profile to database...');
    await driverProfile.save();
    console.log('✅ Driver profile saved successfully:', driverProfile._id);

    // Generate JWT token for driver
    console.log('🔑 Generating JWT token for driver...');
    const token = generateToken({
      id: driver._id.toString(),
      role: 'driver',
      email: driver.email
    });

    // Set HTTP-only cookie
    setAuthCookie(res, token);

    // Return driver info (without password) and token
    const driverResponse = {
      _id: driver._id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      role: 'driver',
      licenseNumber: driver.licenseNumber,
      vehicleType: driver.vehicleType,
      vehicleModel: driver.vehicleModel,
      vehicleNumber: driver.vehicleNumber,
      vehicleImage: driver.vehicleImage,
      isAvailable: driver.isAvailable,
      rating: driver.rating,
      approvalStatus: driverProfile.status
    };

    console.log('🎉 Driver signup completed successfully for:', email);
    res.status(201).json({
      success: true,
      message: 'Driver registered successfully',
      data: {
        driver: driverResponse,
        token
      }
    });

  } catch (error) {
    console.error('❌ Driver signup error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('validation failed')) {
        res.status(400).json({
          success: false,
          message: 'Validation failed: ' + error.message,
          requiredFields: ['name', 'email', 'password', 'phone', 'licenseNumber', 'vehicleType', 'vehicleModel', 'vehicleNumber'],
          optionalFields: ['vehicleImage', 'licenseImage', 'currentLat', 'currentLng']
        });
      } else if (error.message.includes('duplicate key')) {
        // Extract which field caused the duplicate key error
        let errorMessage = 'A driver with this information already exists';
        
        if (error.message.includes('email')) {
          errorMessage = 'A driver with this email already exists';
        } else if (error.message.includes('licenseNumber')) {
          errorMessage = 'A driver with this license number already exists';
        } else if (error.message.includes('vehicleNumber')) {
          errorMessage = 'A driver with this vehicle number already exists';
        }
        
        res.status(400).json({
          success: false,
          message: errorMessage
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error during driver registration: ' + error.message
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error during driver registration'
      });
    }
  }
};

/**
 * POST /api/auth/login
 * User/Driver login endpoint
 * 
 * Test with curl:
 * curl -X POST http://localhost:4000/api/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{"email":"john@example.com","password":"password123"}'
 */
export const login = async (req: Request<{}, {}, LoginBody>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // First check if it's a regular user
    let user = await User.findOne({ email });
    let isDriver = false;

    // If not found in User collection, check Driver collection
    if (!user) {
      const driver = await Driver.findOne({ email });
      if (driver) {
        isDriver = true;
        // Create a user-like object for drivers to maintain consistency
        user = {
          _id: driver._id,
          name: driver.name,
          email: driver.email,
          password: driver.password,
          phone: driver.phone,
          role: 'driver',
          profileImage: driver.vehicleImage,
          defaultPaymentMethod: 'cash' as any,
          savedLocations: [] as any,
          createdAt: driver.createdAt,
          updatedAt: driver.updatedAt
        } as any;
      }
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email
    });

    // Set HTTP-only cookie
    setAuthCookie(res, token);

    // Return user/driver info (without password) and token
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      defaultPaymentMethod: user.defaultPaymentMethod,
      savedLocations: user.savedLocations
    };

    // Add driver-specific info if it's a driver
    if (isDriver) {
      const driver = await Driver.findOne({ email });
      const driverProfile = await DriverProfile.findOne({ driverId: driver?._id });
      
      if (driver) {
        (userResponse as any).driverProfile = {
          driverId: driver._id,
          licenseNumber: driver.licenseNumber,
          vehicleType: driver.vehicleType,
          vehicleModel: driver.vehicleModel,
          vehicleNumber: driver.vehicleNumber,
          isAvailable: driver.isAvailable,
          rating: driver.rating,
          approvalStatus: driverProfile?.status || 'PENDING'
        };
      }
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

/**
 * POST /api/auth/logout
 * User logout endpoint
 * 
 * Test with curl:
 * curl -X POST http://localhost:4000/api/auth/logout \
 *   -H "Authorization: Bearer YOUR_JWT_TOKEN"
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Clear authentication cookie
    clearAuthCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
};

/**
 * POST /api/auth/forgot-password
 * Generate password reset token and (normally) email it to the user/driver
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    // Check both User and Driver collections
    let user = await User.findOne({ email });
    let isDriver = false;

    if (!user) {
      const driver = await Driver.findOne({ email });
      if (driver) {
        user = driver as any;
        isDriver = true;
      }
    }

    if (!user) {
      // Do not reveal that user does not exist
      res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent' });
      return;
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    (user as any).resetPasswordToken = token;
    (user as any).resetPasswordExpires = expires;
    await user.save();

    // Compose reset link (role-specific pages on frontend)
    const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000'
    const rolePath = isDriver ? 'driver' : ((user as any).role || 'user')
    const resetUrl = `${frontendBase}/${rolePath}/reset-password?token=${token}`

    // Try to send email using configured SMTP
    try {
      await sendMail(email, 'Reset your password', `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour.</p>
      `)
    } catch (err) {
      console.warn('SMTP not configured or failed to send. Proceeding without email. Error:', err)
    }

    res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent', data: { token, resetUrl } });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during forgot password' });
  }
};

/**
 * POST /api/auth/reset-password
 * Reset password using a valid token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'Token and newPassword are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    // Check both User and Driver collections for the reset token
    let user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    let isDriver = false;

    if (!user) {
      const driver = await Driver.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
      if (driver) {
        user = driver as any;
        isDriver = true;
      }
    }

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    (user as any).resetPasswordToken = null;
    (user as any).resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during reset password' });
  }
};
