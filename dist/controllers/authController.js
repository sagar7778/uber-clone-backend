"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.logout = exports.login = exports.driverSignup = exports.signup = exports.healthCheck = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const crypto_1 = __importDefault(require("crypto"));
const mailer_1 = require("../utils/mailer");
const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not defined');
    }
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: expiresIn });
};
const setAuthCookie = (res, token) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
    });
};
const clearAuthCookie = (res) => {
    res.clearCookie('auth_token', { path: '/' });
};
const healthCheck = async (req, res) => {
    try {
        const userCount = await models_1.User.countDocuments();
        const driverCount = await models_1.Driver.countDocuments();
        res.status(200).json({
            success: true,
            message: 'Auth service is healthy',
            data: {
                database: 'connected',
                userCount,
                driverCount,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            success: false,
            message: 'Auth service is unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.healthCheck = healthCheck;
const signup = async (req, res) => {
    try {
        const { name, email, password, phone, role = 'user' } = req.body;
        if (role === 'driver') {
            res.status(400).json({
                success: false,
                message: 'Driver signup should use /api/auth/driver-signup endpoint'
            });
            return;
        }
        console.log('🚀 User signup attempt:', { email, role, name: name.substring(0, 3) + '...' });
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            console.log('❌ User already exists:', email);
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
            role
        });
        console.log('💾 Saving user to database...');
        await user.save();
        console.log('✅ User saved successfully:', user._id);
        console.log('🔑 Generating JWT token...');
        const token = generateToken({
            id: user._id.toString(),
            role: user.role,
            email: user.email
        });
        setAuthCookie(res, token);
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            profileImage: user.profileImage,
            defaultPaymentMethod: user.defaultPaymentMethod,
            savedLocations: user.savedLocations
        };
        console.log('🎉 User signup completed successfully for:', email);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userResponse,
                token
            }
        });
    }
    catch (error) {
        console.error('❌ User signup error:', error);
        if (error instanceof Error) {
            if (error.message.includes('validation failed')) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed: ' + error.message
                });
            }
            else if (error.message.includes('duplicate key')) {
                res.status(400).json({
                    success: false,
                    message: 'A user with this information already exists'
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error during registration: ' + error.message
                });
            }
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Internal server error during registration'
            });
        }
    }
};
exports.signup = signup;
const driverSignup = async (req, res) => {
    try {
        const { name, email, password, phone, licenseNumber, vehicleType, vehicleModel, vehicleNumber, vehicleImage, licenseImage, currentLat, currentLng } = req.body;
        console.log('🚗 Driver signup attempt:', { email, name: name.substring(0, 3) + '...' });
        const requiredFields = { name, email, password, phone, licenseNumber, vehicleType, vehicleModel, vehicleNumber };
        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
        if (missingFields.length > 0) {
            console.log('❌ Missing required fields:', missingFields);
            res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                requiredFields: ['name', 'email', 'password', 'phone', 'licenseNumber', 'vehicleType', 'vehicleModel', 'vehicleNumber'],
                optionalFields: ['vehicleImage', 'licenseImage', 'currentLat', 'currentLng']
            });
            return;
        }
        const existingUser = await models_1.User.findOne({ email });
        const existingDriver = await models_1.Driver.findOne({
            $or: [
                { email },
                { licenseNumber },
                { vehicleNumber }
            ]
        });
        if (existingUser || existingDriver) {
            console.log('❌ Driver already exists:', email);
            res.status(400).json({
                success: false,
                message: 'Driver with this email, license number, or vehicle number already exists'
            });
            return;
        }
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const driver = new models_1.Driver({
            name,
            email,
            password: hashedPassword,
            phone,
            licenseNumber,
            licenseImage: licenseImage || 'https://via.placeholder.com/300x200?text=License+Image',
            vehicleType,
            vehicleModel,
            vehicleNumber,
            vehicleImage: vehicleImage || 'https://via.placeholder.com/300x200?text=Vehicle+Image',
            currentLocation: {
                lat: typeof currentLat === 'number' ? currentLat : 0,
                lng: typeof currentLng === 'number' ? currentLng : 0,
                updatedAt: new Date()
            },
            isAvailable: false,
            rating: 5,
            totalEarnings: 0,
            completedRides: 0
        });
        console.log('💾 Saving driver to database...');
        await driver.save();
        console.log('✅ Driver saved successfully:', driver._id);
        const driverProfile = new models_1.DriverProfile({
            driverId: driver._id,
            status: 'PENDING',
            documentsVerified: false,
            backgroundCheckPassed: false,
            insuranceValid: false,
            vehicleInspectionPassed: false
        });
        console.log('💾 Saving driver profile to database...');
        await driverProfile.save();
        console.log('✅ Driver profile saved successfully:', driverProfile._id);
        console.log('🔑 Generating JWT token for driver...');
        const token = generateToken({
            id: driver._id.toString(),
            role: 'driver',
            email: driver.email
        });
        setAuthCookie(res, token);
        const driverResponse = {
            _id: driver._id,
            name: driver.name,
            email: driver.email,
            phone: driver.phone,
            role: 'driver',
            licenseNumber: driver.licenseNumber,
            vehicleType: driver.vehicleType,
            vehicleModel: driver.vehicleModel,
            vehicleNumber: driver.vehicleNumber,
            vehicleImage: driver.vehicleImage,
            isAvailable: driver.isAvailable,
            rating: driver.rating,
            approvalStatus: driverProfile.status
        };
        console.log('🎉 Driver signup completed successfully for:', email);
        res.status(201).json({
            success: true,
            message: 'Driver registered successfully',
            data: {
                driver: driverResponse,
                token
            }
        });
    }
    catch (error) {
        console.error('❌ Driver signup error:', error);
        if (error instanceof Error) {
            if (error.message.includes('validation failed')) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed: ' + error.message,
                    requiredFields: ['name', 'email', 'password', 'phone', 'licenseNumber', 'vehicleType', 'vehicleModel', 'vehicleNumber'],
                    optionalFields: ['vehicleImage', 'licenseImage', 'currentLat', 'currentLng']
                });
            }
            else if (error.message.includes('duplicate key')) {
                res.status(400).json({
                    success: false,
                    message: 'A driver with this information already exists'
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error during driver registration: ' + error.message
                });
            }
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Internal server error during driver registration'
            });
        }
    }
};
exports.driverSignup = driverSignup;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = await models_1.User.findOne({ email });
        let isDriver = false;
        if (!user) {
            const driver = await models_1.Driver.findOne({ email });
            if (driver) {
                isDriver = true;
                user = {
                    _id: driver._id,
                    name: driver.name,
                    email: driver.email,
                    password: driver.password,
                    phone: driver.phone,
                    role: 'driver',
                    profileImage: driver.vehicleImage,
                    defaultPaymentMethod: 'cash',
                    savedLocations: [],
                    createdAt: driver.createdAt,
                    updatedAt: driver.updatedAt
                };
            }
        }
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }
        const token = generateToken({
            id: user._id.toString(),
            role: user.role,
            email: user.email
        });
        setAuthCookie(res, token);
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            profileImage: user.profileImage,
            defaultPaymentMethod: user.defaultPaymentMethod,
            savedLocations: user.savedLocations
        };
        if (isDriver) {
            const driver = await models_1.Driver.findOne({ email });
            const driverProfile = await models_1.DriverProfile.findOne({ driverId: driver?._id });
            if (driver) {
                userResponse.driverProfile = {
                    driverId: driver._id,
                    licenseNumber: driver.licenseNumber,
                    vehicleType: driver.vehicleType,
                    vehicleModel: driver.vehicleModel,
                    vehicleNumber: driver.vehicleNumber,
                    isAvailable: driver.isAvailable,
                    rating: driver.rating,
                    approvalStatus: driverProfile?.status || 'PENDING'
                };
            }
        }
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        clearAuthCookie(res);
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during logout'
        });
    }
};
exports.logout = logout;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }
        let user = await models_1.User.findOne({ email });
        let isDriver = false;
        if (!user) {
            const driver = await models_1.Driver.findOne({ email });
            if (driver) {
                user = driver;
                isDriver = true;
            }
        }
        if (!user) {
            res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent' });
            return;
        }
        const token = crypto_1.default.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000);
        user.resetPasswordToken = token;
        user.resetPasswordExpires = expires;
        await user.save();
        const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
        const rolePath = isDriver ? 'driver' : (user.role || 'user');
        const resetUrl = `${frontendBase}/${rolePath}/reset-password?token=${token}`;
        try {
            await (0, mailer_1.sendMail)(email, 'Reset your password', `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour.</p>
      `);
        }
        catch (err) {
            console.warn('SMTP not configured or failed to send. Proceeding without email. Error:', err);
        }
        res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent', data: { token, resetUrl } });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during forgot password' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            res.status(400).json({ success: false, message: 'Token and newPassword are required' });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
            return;
        }
        let user = await models_1.User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
        let isDriver = false;
        if (!user) {
            const driver = await models_1.Driver.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
            if (driver) {
                user = driver;
                isDriver = true;
            }
        }
        if (!user) {
            res.status(400).json({ success: false, message: 'Invalid or expired token' });
            return;
        }
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
        res.status(200).json({ success: true, message: 'Password reset successful' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during reset password' });
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=authController.js.map