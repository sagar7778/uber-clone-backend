import { Request, Response } from 'express';
import User from '../models/User';
import Driver from '../models/Driver';
import DriverProfile from '../models/DriverProfile';
import Ride from '../models/Ride';
import { IUser } from '../models/User';

// Extend Request to include user
interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Get all users (admin only)
 * GET /api/admin/users
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const users = await User.find({}, { password: 0 })
      .select('name email phone role createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all drivers (admin only)
 * GET /api/admin/drivers
 */
export const getAllDrivers = async (req: AuthRequest, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const drivers = await Driver.find()
      .populate('userId', 'name email phone')
      .populate('driverProfile', 'status documentsVerified backgroundCheckPassed')
      .select('licenseNumber vehicleType vehicleModel vehicleNumber rating isAvailable totalEarnings completedRides createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: drivers,
      count: drivers.length
    });

  } catch (error) {
    console.error('Error getting drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get drivers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all rides (admin only)
 * GET /api/admin/rides
 */
export const getAllRides = async (req: AuthRequest, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const rides = await Ride.find()
      .populate('userId', 'name email phone')
      .populate('driverId', 'vehicleModel vehicleNumber')
      .select('pickupLocation dropLocation distanceKm estimatedFare actualFare paymentStatus status requestedAt completedAt createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: rides,
      count: rides.length
    });

  } catch (error) {
    console.error('Error getting rides:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rides',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Approve a driver (admin only)
 * POST /api/admin/drivers/:driverId/approve
 */
export const approveDriver = async (req: AuthRequest, res: Response) => {
  try {
    const adminUser = req.user;
    const { driverId } = req.params;
    
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID is required'
      });
    }

    // Find driver profile
    const driverProfile = await DriverProfile.findOne({ driverId });
    if (!driverProfile) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    if (driverProfile.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Driver is already approved'
      });
    }

    // Update driver profile status
    driverProfile.status = 'APPROVED';
    driverProfile.approvedBy = adminUser._id;
    driverProfile.approvedAt = new Date();
    await driverProfile.save();

    // Update driver availability
    await Driver.findByIdAndUpdate(driverId, {
      isAvailable: true
    });

    res.status(200).json({
      success: true,
      message: 'Driver approved successfully',
      data: {
        driverId,
        status: driverProfile.status,
        approvedAt: driverProfile.approvedAt
      }
    });

  } catch (error) {
    console.error('Error approving driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve driver',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reject a driver (admin only)
 * POST /api/admin/drivers/:driverId/reject
 */
export const rejectDriver = async (req: AuthRequest, res: Response) => {
  try {
    const adminUser = req.user;
    const { driverId } = req.params;
    const { reason } = req.body;
    
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID is required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Find driver profile
    const driverProfile = await DriverProfile.findOne({ driverId });
    if (!driverProfile) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    if (driverProfile.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Driver is already rejected'
      });
    }

    // Update driver profile status
    driverProfile.status = 'REJECTED';
    driverProfile.rejectionReason = reason;
    driverProfile.rejectedBy = adminUser._id;
    driverProfile.rejectedAt = new Date();
    await driverProfile.save();

    // Update driver availability
    await Driver.findByIdAndUpdate(driverId, {
      isAvailable: false
    });

    res.status(200).json({
      success: true,
      message: 'Driver rejected successfully',
      data: {
        driverId,
        status: driverProfile.status,
        rejectionReason: driverProfile.rejectionReason,
        rejectedAt: driverProfile.rejectedAt
      }
    });

  } catch (error) {
    console.error('Error rejecting driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject driver',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get dashboard statistics (admin only)
 * GET /api/admin/dashboard
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const adminUser = req.user;
    
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Get counts
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalDrivers = await Driver.countDocuments();
    const totalRides = await Ride.countDocuments();
    const pendingApprovals = await DriverProfile.countDocuments({ status: 'PENDING' });

    // Get recent activity
    const recentRides = await Ride.find()
      .populate('userId', 'name')
      .populate('driverId', 'vehicleModel')
      .select('pickupLocation dropLocation status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find({ role: 'user' })
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          totalUsers,
          totalDrivers,
          totalRides,
          pendingApprovals
        },
        recentActivity: {
          rides: recentRides,
          users: recentUsers
        }
      }
    });

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
