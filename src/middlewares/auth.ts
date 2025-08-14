import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Extended Request interface with user property
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

/**
 * JWT payload interface
 */
interface JWTPayload {
  id: string;
  role: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Authentication middleware
 * Reads JWT token from Authorization header or HTTP-only cookie
 * Verifies token and attaches user info to req.user
 * Responds with 401 if token is invalid or missing
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization header first (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // If no Bearer token, check HTTP-only cookie
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    // If no token found
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      
      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        res.status(401).json({
          success: false,
          message: 'Token expired'
        });
        return;
      }

      // Attach user info to request
      req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email
      };

      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Optional authentication middleware
 * Similar to authenticate but doesn't block the request if no token
 * Useful for endpoints that can work with or without authentication
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization header first (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // If no Bearer token, check HTTP-only cookie
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    // If no token found, continue without authentication
    if (!token) {
      next();
      return;
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      
      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        next();
        return;
      }

      // Attach user info to request
      req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email
      };

      next();
    } catch (jwtError) {
      // Token is invalid, continue without authentication
      next();
    }

  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    // Continue without authentication on error
    next();
  }
};
