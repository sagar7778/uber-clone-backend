import { Router } from 'express';
import { 
  getDriverProfile, 
  updateDriverProfile, 
  acceptRide, 
  getDriverRides 
} from '../controllers/driverController';
import { authenticate, requireRole } from '../middlewares';

/**
 * Driver Router
 * Handles driver profile management and ride acceptance
 */

const router = Router();

/**
 * GET /api/driver/profile
 * Get driver profile
 * Requires driver role authentication
 */
router.get('/profile', authenticate, requireRole('driver'), getDriverProfile);

/**
 * PUT /api/driver/profile
 * Update driver profile
 * Requires driver role authentication
 */
router.put('/profile', authenticate, requireRole('driver'), updateDriverProfile);

/**
 * POST /api/driver/accept/:rideId
 * Accept a ride request
 * Requires driver role authentication
 */
router.post('/accept/:rideId', authenticate, requireRole('driver'), acceptRide);

/**
 * GET /api/driver/rides
 * Get driver's ride history
 * Requires driver role authentication
 */
router.get('/rides', authenticate, requireRole('driver'), getDriverRides);

export default router;
