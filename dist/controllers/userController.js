"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStats = exports.resetUserPassword = exports.changeUserRole = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../models");
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;
        const query = {};
        if (role && ['user', 'driver', 'admin'].includes(role)) {
            query.role = role;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const users = await models_1.User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await models_1.User.countDocuments(query);
        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalUsers: total,
                    hasNextPage: skip + users.length < total,
                    hasPrevPage: Number(page) > 1
                }
            }
        });
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching users'
        });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await models_1.User.findById(id).select('-password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching user'
        });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const { name, email, password, phone, role, profileImage, defaultPaymentMethod, savedLocations } = req.body;
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
            return;
        }
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const user = new models_1.User({
            name,
            email,
            password: hashedPassword,
            phone,
            role,
            profileImage,
            defaultPaymentMethod: defaultPaymentMethod || 'card',
            savedLocations: savedLocations || []
        });
        await user.save();
        if (role === 'driver') {
            const driver = new models_1.Driver({
                userId: user._id,
                licenseNumber: '',
                licenseImage: '',
                vehicleType: 'sedan',
                vehicleModel: '',
                vehicleNumber: '',
                vehicleImage: '',
                currentLocation: {
                    lat: 0,
                    lng: 0,
                    updatedAt: new Date()
                }
            });
            await driver.save();
        }
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            profileImage: user.profileImage,
            defaultPaymentMethod: user.defaultPaymentMethod,
            savedLocations: user.savedLocations,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user: userResponse }
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating user'
        });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        delete updateData.password;
        delete updateData.role;
        const user = await models_1.User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: { user }
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating user'
        });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await models_1.User.findById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        if (user.role === 'admin') {
            res.status(403).json({
                success: false,
                message: 'Cannot delete admin users'
            });
            return;
        }
        if (user.role === 'driver') {
            await models_1.Driver.findOneAndDelete({ userId: user._id });
        }
        await models_1.User.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting user'
        });
    }
};
exports.deleteUser = deleteUser;
const changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { newRole } = req.body;
        if (!['user', 'driver', 'admin'].includes(newRole)) {
            res.status(400).json({
                success: false,
                message: 'Invalid role. Must be user, driver, or admin'
            });
            return;
        }
        const user = await models_1.User.findById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        const oldRole = user.role;
        user.role = newRole;
        await user.save();
        if (newRole === 'driver' && oldRole !== 'driver') {
            const existingDriver = await models_1.Driver.findOne({ userId: user._id });
            if (!existingDriver) {
                const driver = new models_1.Driver({
                    userId: user._id,
                    licenseNumber: '',
                    licenseImage: '',
                    vehicleType: 'sedan',
                    vehicleModel: '',
                    vehicleNumber: '',
                    vehicleImage: '',
                    currentLocation: {
                        lat: 0,
                        lng: 0,
                        updatedAt: new Date()
                    }
                });
                await driver.save();
            }
        }
        else if (oldRole === 'driver' && newRole !== 'driver') {
            await models_1.Driver.findOneAndDelete({ userId: user._id });
        }
        res.status(200).json({
            success: true,
            message: `User role changed from ${oldRole} to ${newRole}`,
            data: { user: { ...user.toObject(), password: undefined } }
        });
    }
    catch (error) {
        console.error('Change user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while changing user role'
        });
    }
};
exports.changeUserRole = changeUserRole;
const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
            return;
        }
        const user = await models_1.User.findById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'User password reset successfully'
        });
    }
    catch (error) {
        console.error('Reset user password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while resetting password'
        });
    }
};
exports.resetUserPassword = resetUserPassword;
const getUserStats = async (req, res) => {
    try {
        const totalUsers = await models_1.User.countDocuments();
        const totalDrivers = await models_1.User.countDocuments({ role: 'driver' });
        const totalAdmins = await models_1.User.countDocuments({ role: 'admin' });
        const totalRegularUsers = await models_1.User.countDocuments({ role: 'user' });
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newUsersThisMonth = await models_1.User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });
        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalDrivers,
                totalAdmins,
                totalRegularUsers,
                newUsersThisMonth,
                userDistribution: {
                    regular: totalRegularUsers,
                    drivers: totalDrivers,
                    admins: totalAdmins
                }
            }
        });
    }
    catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching user statistics'
        });
    }
};
exports.getUserStats = getUserStats;
//# sourceMappingURL=userController.js.map