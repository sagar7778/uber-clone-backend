import { Request, Response } from 'express';
import { Driver, DriverProfile, Ride } from '../models';
import { AuthRequest } from '../middlewares/auth';

/**
 * Driver Controller
 * Handles driver profile management and ride acceptance
 */

/**
 * GET /api/driver/profile
 * Get driver profile (protected - driver only)
 */
export const getDriverProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
      return;
    }

    const driverProfile = await DriverProfile.findOne({ driverId: driver._id });

    res.status(200).json({
      success: true,
      data: {
        driver: {
          _id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          licenseImage: driver.licenseImage,
          vehicleType: driver.vehicleType,
          vehicleModel: driver.vehicleModel,
          vehicleNumber: driver.vehicleNumber,
          vehicleImage: driver.vehicleImage,
          rating: driver.rating,
          isAvailable: driver.isAvailable,
          currentLocation: driver.currentLocation,
          totalEarnings: driver.totalEarnings,
          completedRides: driver.completedRides,
          approvalStatus: driverProfile?.status || 'PENDING'
        }
      }
    });

  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching driver profile'
    });
  }
};

/**
 * PUT /api/driver/profile
 * Update driver profile (protected - driver only)
 */
export const updateDriverProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { 
      name, 
      phone, 
      licenseImage, 
      vehicleImage, 
      currentLat, 
      currentLng,
      isAvailable 
    } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
      return;
    }

    // Update allowed fields
    if (name) driver.name = name;
    if (phone) driver.phone = phone;
    if (licenseImage) driver.licenseImage = licenseImage;
    if (vehicleImage) driver.vehicleImage = vehicleImage;
    if (typeof currentLat === 'number') driver.currentLocation.lat = currentLat;
    if (typeof currentLng === 'number') driver.currentLocation.lng = currentLng;
    if (typeof isAvailable === 'boolean') driver.isAvailable = isAvailable;
    
    driver.currentLocation.updatedAt = new Date();

    await driver.save();

    res.status(200).json({
      success: true,
      message: 'Driver profile updated successfully',
      data: {
        driver: {
          _id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          licenseImage: driver.licenseImage,
          vehicleType: driver.vehicleType,
          vehicleModel: driver.vehicleModel,
          vehicleNumber: driver.vehicleNumber,
          vehicleImage: driver.vehicleImage,
          rating: driver.rating,
          isAvailable: driver.isAvailable,
          currentLocation: driver.currentLocation,
          totalEarnings: driver.totalEarnings,
          completedRides: driver.completedRides
        }
      }
    });

  } catch (error) {
    console.error('Update driver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating driver profile'
    });
  }
};

/**
 * POST /api/driver/accept/:rideId
 * Accept a ride request (protected - driver only)
 */
export const acceptRide = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const driverId = req.user?.id;
    const { rideId } = req.params;

    if (!driverId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!rideId) {
      res.status(400).json({
        success: false,
        message: 'Ride ID is required'
      });
      return;
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
      return;
    }

    if (!driver.isAvailable) {
      res.status(400).json({
        success: false,
        message: 'Driver is not available for rides'
      });
      return;
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
      return;
    }

    if (ride.status !== 'requested') {
      res.status(400).json({
        success: false,
        message: 'Ride is not available for acceptance'
      });
      return;
    }

    // Update ride with driver assignment
    ride.driverId = driver._id;
    ride.status = 'accepted';
    ride.acceptedAt = new Date();
    await ride.save();

    // Update driver availability
    driver.isAvailable = false;
    await driver.save();

    // Emit socket event to ride room
    emitToRideRoom(rideId, 'ride:accepted', {
      rideId: ride._id,
      driverId: driver._id,
      driverInfo: {
        name: driver.name,
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehicleNumber: driver.vehicleNumber,
        rating: driver.rating
      },
      acceptedAt: ride.acceptedAt
    });

    // Emit to specific user
    emitToUser(ride.userId.toString(), 'ride:accepted', {
      rideId: ride._id,
      driverId: driver._id,
      driverInfo: {
        name: driver.name,
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehicleNumber: driver.vehicleNumber,
        rating: driver.rating
      },
      acceptedAt: ride.acceptedAt
    });

    res.status(200).json({
      success: true,
      message: 'Ride accepted successfully',
      data: {
        ride
      }
    });

  } catch (error) {
    console.error('Accept ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while accepting ride'
    });
  }
};

/**
 * GET /api/driver/rides
 * Get driver's ride history (protected - driver only)
 */
export const getDriverRides = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const driverId = req.user?.id;
    if (!driverId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
      return;
    }

    const rides = await Ride.find({ driverId: driver._id })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        rides
      }
    });

  } catch (error) {
    console.error('Get driver rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching driver rides'
    });
  }
};

// Helper function for socket emissions (you'll need to implement this)
const emitToRideRoom = (rideId: string, event: string, data: any) => {
  // Implementation depends on your socket setup
  console.log(`Emit ${event} to ride room ${rideId}:`, data);
};

const emitToUser = (userId: string, event: string, data: any) => {
  // Implementation depends on your socket setup
  console.log(`Emit ${event} to user ${userId}:`, data);
};
