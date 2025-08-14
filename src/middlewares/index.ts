// Export all middleware functions
export { authenticate, optionalAuth, AuthRequest } from './auth';
export { 
  requireRole, 
  requireAdmin, 
  requireDriver, 
  requireUser, 
  requireDriverOrUser, 
  requireAdminOrDriver, 
  requireAuth 
} from './roles';

// Re-export common types
export type { Request, Response, NextFunction } from 'express';
