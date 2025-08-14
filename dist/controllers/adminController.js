"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.rejectDriver = exports.approveDriver = exports.getAllRides = exports.getAllDrivers = exports.getAllUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const Driver_1 = __importDefault(require("../models/Driver"));
const DriverProfile_1 = __importDefault(require("../models/DriverProfile"));
const Ride_1 = __importDefault(require("../models/Ride"));
const getAllUsers = async (req, res) => {
    try {
        const adminUser = req.user;
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        const users = await User_1.default.find({}, { password: 0 })
            .select('name email phone role createdAt')
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: users,
            count: users.length
        });
    }
    catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getAllUsers = getAllUsers;
const getAllDrivers = async (req, res) => {
    try {
        const adminUser = req.user;
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        const drivers = await Driver_1.default.find()
            .populate('userId', 'name email phone')
            .populate('driverProfile', 'status documentsVerified backgroundCheckPassed')
            .select('licenseNumber vehicleType vehicleModel vehicleNumber rating isAvailable totalEarnings completedRides createdAt')
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: drivers,
            count: drivers.length
        });
    }
    catch (error) {
        console.error('Error getting drivers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get drivers',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getAllDrivers = getAllDrivers;
const getAllRides = async (req, res) => {
    try {
        const adminUser = req.user;
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        const rides = await Ride_1.default.find()
            .populate('userId', 'name email phone')
            .populate('driverId', 'vehicleModel vehicleNumber')
            .select('pickupLocation dropLocation distanceKm estimatedFare actualFare paymentStatus status requestedAt completedAt createdAt')
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: rides,
            count: rides.length
        });
    }
    catch (error) {
        console.error('Error getting rides:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get rides',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getAllRides = getAllRides;
const approveDriver = async (req, res) => {
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
        const driverProfile = await DriverProfile_1.default.findOne({ driverId });
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
        driverProfile.status = 'APPROVED';
        driverProfile.approvedBy = adminUser._id;
        driverProfile.approvedAt = new Date();
        await driverProfile.save();
        await Driver_1.default.findByIdAndUpdate(driverId, {
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
    }
    catch (error) {
        console.error('Error approving driver:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve driver',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.approveDriver = approveDriver;
const rejectDriver = async (req, res) => {
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
        const driverProfile = await DriverProfile_1.default.findOne({ driverId });
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
        driverProfile.status = 'REJECTED';
        driverProfile.rejectionReason = reason;
        driverProfile.rejectedBy = adminUser._id;
        driverProfile.rejectedAt = new Date();
        await driverProfile.save();
        await Driver_1.default.findByIdAndUpdate(driverId, {
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
    }
    catch (error) {
        console.error('Error rejecting driver:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject driver',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.rejectDriver = rejectDriver;
const getDashboardStats = async (req, res) => {
    try {
        const adminUser = req.user;
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        const totalUsers = await User_1.default.countDocuments({ role: 'user' });
        const totalDrivers = await Driver_1.default.countDocuments();
        const totalRides = await Ride_1.default.countDocuments();
        const pendingApprovals = await DriverProfile_1.default.countDocuments({ status: 'PENDING' });
        const recentRides = await Ride_1.default.find()
            .populate('userId', 'name')
            .populate('driverId', 'vehicleModel')
            .select('pickupLocation dropLocation status createdAt')
            .sort({ createdAt: -1 })
            .limit(5);
        const recentUsers = await User_1.default.find({ role: 'user' })
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
    }
    catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getDashboardStats = getDashboardStats;
//# sourceMappingURL=adminController.js.map