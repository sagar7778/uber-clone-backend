import express from 'express';
import { 
  getAllUsers, 
  getAllDrivers, 
  getAllRides, 
  approveDriver, 
  rejectDriver, 
  getDashboardStats 
} from '../controllers/adminController';
import { authenticate } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('admin'));

// Dashboard statistics
router.get('/dashboard', getDashboardStats);

// User management
router.get('/users', getAllUsers);

// Driver management
router.get('/drivers', getAllDrivers);
router.post('/drivers/:driverId/approve', approveDriver);
router.post('/drivers/:driverId/reject', rejectDriver);

// Ride management
router.get('/rides', getAllRides);

export default router;
