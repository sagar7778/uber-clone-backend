import { Router } from 'express';
import { 
  requestRide, 
  getRide, 
  cancelRide, 
  updateRideStatus,
  estimateFare,
  arriveRide,
  startRideController,
  completeRideController,
  rateRide
} from '../controllers/rideController';
import { authenticate, requireRole } from '../middlewares';

/**
 * Ride Router
 * Handles ride requests, updates, and management
 */

const router = Router();

/**
 * GET /api/rides/estimate
 * Estimate distance, duration and fare
 */
router.get('/estimate', estimateFare);

/**
 * POST /api/rides/request
 * Create a new ride request
 * Requires authentication (any user)
 */
router.post('/request', authenticate, requestRide);

/**
 * GET /api/rides/:id
 * Get ride by ID
 * Public endpoint (no authentication required)
 */
router.get('/:id', getRide);

/**
 * POST /api/rides/:id/cancel
 * Cancel a ride
 * Requires authentication (user who requested the ride, assigned driver, or admin)
 */
router.post('/:id/cancel', authenticate, cancelRide);

/**
 * POST /api/rides/:id/status
 * Update ride status (driver only)
 * Requires driver role authentication
 */
router.post('/:id/status', authenticate, requireRole('driver'), updateRideStatus);

/**
 * POST /api/rides/:id/arrive
 * Driver marks arrived
 */
router.post('/:id/arrive', authenticate, requireRole('driver'), arriveRide);

/**
 * POST /api/rides/:id/start
 * Driver starts ride
 */
router.post('/:id/start', authenticate, requireRole('driver'), startRideController);

/**
 * POST /api/rides/:id/complete
 * Driver completes ride
 */
router.post('/:id/complete', authenticate, requireRole('driver'), completeRideController);

/**
 * POST /api/rides/:id/rate
 * Passenger rates the ride
 */
router.post('/:id/rate', authenticate, rateRide);

export default router;
