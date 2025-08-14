import { Request, Response } from 'express';
import { Ride, User, Driver } from '../models';
import { AuthRequest } from '../middlewares/auth';
import { emitToNearbyDrivers, emitToRideRoom } from '../sockets/helpers';

/**
 * Ride Controller
 * Handles ride requests, updates, and real-time communication
 */

interface RideRequestBody {
  pickupLocation: string;
  dropLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  estimatedFare: number;
  distanceKm: number;
}

interface StatusUpdateBody {
  status: 'accepted' | 'on_the_way' | 'arrived' | 'in_progress' | 'completed';
}

/**
 * GET /api/rides/estimate
 * Estimate distance, duration and fare
 */
export const estimateFare = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng, vehicleType = 'sedan' } = req.query as any;

    const lat1 = Number(pickupLat);
    const lon1 = Number(pickupLng);
    const lat2 = Number(dropLat);
    const lon2 = Number(dropLng);

    if ([lat1, lon1, lat2, lon2].some((v) => isNaN(v))) {
      res.status(400).json({ success: false, message: 'Invalid coordinates' });
      return;
    }

    // Haversine distance
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Number((R * c).toFixed(2));

    // Simple duration estimate: 30 km/h average
    const durationMin = Math.max(5, Math.round((distanceKm / 30) * 60));

    // Simple fare model
    const baseFareByType: Record<string, number> = { sedan: 40, suv: 60, hatchback: 35, bike: 20, auto: 25 };
    const perKmByType: Record<string, number> = { sedan: 12, suv: 16, hatchback: 10, bike: 6, auto: 8 };
    const perMin = 1; // common per-minute
    const base = baseFareByType[vehicleType] ?? 40;
    const perKm = perKmByType[vehicleType] ?? 12;
    const estimatedFare = Number((base + distanceKm * perKm + durationMin * perMin).toFixed(2));

    res.status(200).json({ success: true, data: { distanceKm, durationMin, estimatedFare, vehicleType } });
  } catch (error) {
    console.error('Estimate fare error:', error);
    res.status(500).json({ success: false, message: 'Failed to estimate fare' });
  }
};

/**
 * POST /api/rides/request
 * Create a new ride request
 */
export const requestRide = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const {
      pickupLocation,
      dropLocation,
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      estimatedFare,
      distanceKm
    }: RideRequestBody = req.body;

    // Validate required fields
    if (!pickupLocation || !dropLocation || !pickupLat || !pickupLng || !dropLat || !dropLng || !estimatedFare || !distanceKm) {
      res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
      return;
    }

    // Create new ride
    const ride = new Ride({
      userId,
      pickupLocation: {
        address: pickupLocation,
        lat: pickupLat,
        lng: pickupLng
      },
      dropLocation: {
        address: dropLocation,
        lat: dropLat,
        lng: dropLng
      },
      estimatedFare,
      distanceKm,
      status: 'requested',
      requestedAt: new Date()
    });

    await ride.save();

    // Emit socket event to nearby drivers
    const rideSummary = {
      rideId: ride._id,
      pickupLocation: ride.pickupLocation,
      dropLocation: ride.dropLocation,
      estimatedFare: ride.estimatedFare,
      distanceKm: ride.distanceKm,
      requestedAt: ride.requestedAt
    };

    emitToNearbyDrivers(pickupLat, pickupLng, 'ride:request', rideSummary);

    res.status(201).json({
      success: true,
      message: 'Ride requested successfully',
      data: {
        ride
      }
    });

  } catch (error) {
    console.error('Request ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during ride request'
    });
  }
};

/**
 * GET /api/rides/:id
 * Get ride by ID
 */
export const getRide = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const ride = await Ride.findById(id)
      .populate('userId', 'name email phone')
      .populate('driverId', 'vehicleType vehicleModel vehicleNumber rating');

    if (!ride) {
      res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ride
      }
    });

  } catch (error) {
    console.error('Get ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching ride'
    });
  }
};

/**
 * POST /api/rides/:id/cancel
 * Cancel a ride (allowed for user or driver)
 */
export const cancelRide = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    const ride = await Ride.findById(id);
    if (!ride) {
      res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
      return;
    }

    // Check if user can cancel this ride
    const canCancel = 
      ride.userId.toString() === userId || 
      (userRole === 'driver' && ride.driverId?.toString() === userId) ||
      userRole === 'admin';

    if (!canCancel) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this ride'
      });
      return;
    }

    // Check if ride can be cancelled
    if (['completed', 'cancelled'].includes(ride.status)) {
      res.status(400).json({
        success: false,
        message: 'Ride cannot be cancelled in its current status'
      });
      return;
    }

    // Update ride status
    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    await ride.save();

    // Emit socket event
    emitToRideRoom(ride._id.toString(), 'ride:status', {
      rideId: ride._id,
      status: ride.status,
      cancelledAt: ride.cancelledAt
    });

    res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      data: {
        ride
      }
    });

  } catch (error) {
    console.error('Cancel ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while cancelling ride'
    });
  }
};

/**
 * POST /api/rides/:id/status
 * Update ride status (driver only)
 */
export const updateRideStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (userRole !== 'driver') {
      res.status(403).json({
        success: false,
        message: 'Only drivers can update ride status'
      });
      return;
    }

    const { id } = req.params;
    const { status }: StatusUpdateBody = req.body;

    const ride = await Ride.findById(id);
    if (!ride) {
      res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
      return;
    }

    // Check if driver is assigned to this ride
    if (ride.driverId?.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'You are not assigned to this ride'
      });
      return;
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'accepted': ['on_the_way'],
      'on_the_way': ['arrived'],
      'arrived': ['in_progress'],
      'in_progress': ['completed']
    };

    if (!validTransitions[ride.status]?.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status transition from ${ride.status} to ${status}`
      });
      return;
    }

    // Update ride status and timestamps
    ride.status = status;
    
    switch (status) {
      case 'on_the_way':
        ride.startedAt = new Date();
        break;
      case 'arrived':
        // No additional timestamp needed
        break;
      case 'in_progress':
        // No additional timestamp needed
        break;
      case 'completed':
        ride.completedAt = new Date();
        break;
    }

    await ride.save();

    // Emit socket event
    emitToRideRoom(ride._id.toString(), 'ride:status', {
      rideId: ride._id,
      status: ride.status,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Ride status updated successfully',
      data: {
        ride
      }
    });

  } catch (error) {
    console.error('Update ride status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating ride status'
    });
  }
};

// Convenience endpoints mapping to status changes
export const arriveRide = async (req: AuthRequest, res: Response): Promise<void> => {
  (req as any).body.status = 'arrived';
  return updateRideStatus(req, res);
};

export const startRideController = async (req: AuthRequest, res: Response): Promise<void> => {
  (req as any).body.status = 'in_progress';
  return updateRideStatus(req, res);
};

export const completeRideController = async (req: AuthRequest, res: Response): Promise<void> => {
  (req as any).body.status = 'completed';
  return updateRideStatus(req, res);
};

/**
 * POST /api/rides/:id/rate
 * Rate a completed ride and update driver rating
 */
export const rateRide = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { rating = 5 } = req.body as { rating: number };

    if (rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      return;
    }

    const ride = await Ride.findById(id);
    if (!ride) {
      res.status(404).json({ success: false, message: 'Ride not found' });
      return;
    }

    if (ride.userId.toString() !== userId) {
      res.status(403).json({ success: false, message: 'Only the passenger can rate this ride' });
      return;
    }

    if (ride.status !== 'completed') {
      res.status(400).json({ success: false, message: 'Ride must be completed before rating' });
      return;
    }

    if (!ride.driverId) {
      res.status(400).json({ success: false, message: 'No driver assigned to this ride' });
      return;
    }

    const driver = await Driver.findById(ride.driverId);
    if (!driver) {
      res.status(404).json({ success: false, message: 'Driver not found' });
      return;
    }

    // Weighted average update
    const totalRatings = driver.completedRides || 0;
    const currentAvg = driver.rating || 5;
    const newAvg = (currentAvg * totalRatings + rating) / (totalRatings + 1);
    driver.rating = Number(newAvg.toFixed(2));
    await driver.save();

    res.status(200).json({ success: true, message: 'Thanks for your rating', data: { driverRating: driver.rating } });
  } catch (error) {
    console.error('Rate ride error:', error);
    res.status(500).json({ success: false, message: 'Failed to rate ride' });
  }
};
