import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Role-based authorization middleware
 * Restricts access to endpoints based on user roles
 * Must be used after the authenticate middleware
 * 
 * @param roles - Array of allowed roles
 * @returns Express middleware function
 * 
 * Usage examples:
 * - requireRole('admin') - Only admin users
 * - requireRole('user', 'driver') - User or driver users
 * - requireRole('admin', 'driver') - Admin or driver users
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role authorization middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during authorization'
      });
    }
  };
};

/**
 * Admin-only middleware
 * Shorthand for requireRole('admin')
 */
export const requireAdmin = requireRole('admin');

/**
 * Driver-only middleware
 * Shorthand for requireRole('driver')
 */
export const requireDriver = requireRole('driver');

/**
 * User-only middleware
 * Shorthand for requireRole('user')
 */
export const requireUser = requireRole('user');

/**
 * Driver or User middleware
 * Allows both driver and user roles
 */
export const requireDriverOrUser = requireRole('driver', 'user');

/**
 * Admin or Driver middleware
 * Allows both admin and driver roles
 */
export const requireAdminOrDriver = requireRole('admin', 'driver');

/**
 * Any authenticated user middleware
 * Allows any authenticated user regardless of role
 * Useful for endpoints that just need authentication but not specific roles
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }
    next();
  } catch (error) {
    console.error('Authentication check middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication check'
    });
  }
};
