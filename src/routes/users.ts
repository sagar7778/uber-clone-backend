import { Router } from 'express';
import { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  changeUserRole, 
  resetUserPassword, 
  getUserStats 
} from '../controllers/userController';
import { authenticate, requireRole } from '../middlewares';

/**
 * User Management Router
 * Handles CRUD operations for users (admin only)
 */

const router = Router();

// All user routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('admin'));

/**
 * GET /api/users
 * Get all users with pagination and filtering
 * Query params: page, limit, role, search
 */
router.get('/', getAllUsers);

/**
 * GET /api/users/stats
 * Get user statistics
 */
router.get('/stats', getUserStats);

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', getUserById);

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', createUser);

/**
 * PUT /api/users/:id
 * Update user by ID
 */
router.put('/:id', updateUser);

/**
 * DELETE /api/users/:id
 * Delete user by ID
 */
router.delete('/:id', deleteUser);

/**
 * POST /api/users/:id/change-role
 * Change user role
 */
router.post('/:id/change-role', changeUserRole);

/**
 * POST /api/users/:id/reset-password
 * Reset user password
 */
router.post('/:id/reset-password', resetUserPassword);

export default router;
