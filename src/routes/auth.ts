import { Router, Response } from 'express';
import { signup, driverSignup, login, logout, forgotPassword, resetPassword, healthCheck } from '../controllers/authController';
import { authenticate, AuthRequest } from '../middlewares/auth';

/**
 * Authentication Router
 * Handles user registration, login, and logout
 */

const router = Router();

/**
 * GET /api/auth/health
 * Health check endpoint for debugging
 */
router.get('/health', healthCheck);

/**
 * POST /api/auth/signup
 * User registration endpoint (for regular users and admins only)
 * 
 * Request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "password123",
 *   "phone": "1234567890",
 *   "role": "user" // optional, defaults to "user"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "user": { ... },
 *     "token": "jwt_token_here"
 *   }
 * }
 */
router.post('/signup', signup);

/**
 * POST /api/auth/driver-signup
 * Driver registration endpoint (separate from user signup)
 * 
 * Request body:
 * {
 *   "name": "Driver Name",
 *   "email": "driver@example.com",
 *   "password": "password123",
 *   "phone": "1234567890",
 *   "licenseNumber": "DL123456",
 *   "vehicleType": "sedan",
 *   "vehicleModel": "Toyota Camry",
 *   "vehicleNumber": "ABC123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Driver registered successfully",
 *   "data": {
 *     "driver": { ... },
 *     "token": "jwt_token_here"
 *   }
 * }
 */
router.post('/driver-signup', driverSignup);

/**
 * POST /api/auth/login
 * User login endpoint
 * 
 * Request body:
 * {
 *   "email": "john@example.com",
 *   "password": "password123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "user": { ... },
 *     "token": "jwt_token_here"
 *   }
 * }
 */
router.post('/login', login);

/**
 * POST /api/auth/logout
 * User logout endpoint
 * Requires authentication
 * 
 * Headers:
 * Authorization: Bearer <token>
 * OR
 * Cookie: auth_token=<token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Logout successful"
 * }
 */
router.post('/logout', authenticate, logout);

/**
 * GET /api/auth/me
 * Get current user information
 * Requires authentication
 * 
 * Headers:
 * Authorization: Bearer <token>
 * OR
 * Cookie: auth_token=<token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { ... }
 *   }
 * }
 */
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  // This endpoint will be implemented in the user controller
  // For now, just return the authenticated user info
  res.json({
    success: true,
    data: {
      user: {
        id: req.user?.id,
        role: req.user?.role,
        email: req.user?.email
      }
    }
  });
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', forgotPassword);

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', resetPassword);

export default router;
