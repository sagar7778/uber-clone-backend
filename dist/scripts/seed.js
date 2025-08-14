"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
const Driver_1 = __importDefault(require("../models/Driver"));
const DriverProfile_1 = __importDefault(require("../models/DriverProfile"));
const Ride_1 = __importDefault(require("../models/Ride"));
const Payment_1 = __importDefault(require("../models/Payment"));
dotenv_1.default.config();
async function seedDatabase() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/uber-clone';
        await mongoose_1.default.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        await User_1.default.deleteMany({});
        await Driver_1.default.deleteMany({});
        await DriverProfile_1.default.deleteMany({});
        await Ride_1.default.deleteMany({});
        await Payment_1.default.deleteMany({});
        console.log('✅ Cleared existing data');
        const adminPassword = await bcryptjs_1.default.hash('admin123', 12);
        const adminUser = new User_1.default({
            name: 'Admin User',
            email: 'admin@uberclone.com',
            password: adminPassword,
            phone: '9999999999',
            role: 'admin'
        });
        await adminUser.save();
        console.log('✅ Created admin user');
        const user1Password = await bcryptjs_1.default.hash('user123', 12);
        const user1 = new User_1.default({
            name: 'John Doe',
            email: 'john@example.com',
            password: user1Password,
            phone: '1111111111',
            role: 'user'
        });
        await user1.save();
        const user2Password = await bcryptjs_1.default.hash('user123', 12);
        const user2 = new User_1.default({
            name: 'Jane Smith',
            email: 'jane@example.com',
            password: user2Password,
            phone: '2222222222',
            role: 'user'
        });
        await user2.save();
        console.log('✅ Created normal users');
        const driver1Password = await bcryptjs_1.default.hash('driver123', 12);
        const driver1User = new User_1.default({
            name: 'Mike Johnson',
            email: 'mike@example.com',
            password: driver1Password,
            phone: '3333333333',
            role: 'driver'
        });
        await driver1User.save();
        const driver2Password = await bcryptjs_1.default.hash('driver123', 12);
        const driver2User = new User_1.default({
            name: 'Sarah Wilson',
            email: 'sarah@example.com',
            password: driver2Password,
            phone: '4444444444',
            role: 'driver'
        });
        await driver2User.save();
        const driver1 = new Driver_1.default({
            userId: driver1User._id,
            licenseNumber: 'DL123456789',
            licenseImage: 'https://example.com/license1.jpg',
            vehicleType: 'sedan',
            vehicleModel: 'Toyota Camry',
            vehicleNumber: 'MH12AB1234',
            vehicleImage: 'https://example.com/car1.jpg',
            rating: 4.8,
            isAvailable: true,
            currentLocation: {
                lat: 19.0760,
                lng: 72.8777,
                updatedAt: new Date()
            },
            totalEarnings: 15000,
            completedRides: 45
        });
        await driver1.save();
        const driver2 = new Driver_1.default({
            userId: driver2User._id,
            licenseNumber: 'DL987654321',
            licenseImage: 'https://example.com/license2.jpg',
            vehicleType: 'suv',
            vehicleModel: 'Honda CR-V',
            vehicleNumber: 'MH12CD5678',
            vehicleImage: 'https://example.com/car2.jpg',
            rating: 4.6,
            isAvailable: false,
            currentLocation: {
                lat: 19.0760,
                lng: 72.8777,
                updatedAt: new Date()
            },
            totalEarnings: 12000,
            completedRides: 32
        });
        await driver2.save();
        const driver1Profile = new DriverProfile_1.default({
            driverId: driver1._id,
            status: 'APPROVED',
            documentsVerified: true,
            backgroundCheckPassed: true,
            insuranceValid: true,
            vehicleInspectionPassed: true,
            approvedBy: adminUser._id,
            approvedAt: new Date()
        });
        await driver1Profile.save();
        const driver2Profile = new DriverProfile_1.default({
            driverId: driver2._id,
            status: 'PENDING',
            documentsVerified: false,
            backgroundCheckPassed: false,
            insuranceValid: false,
            vehicleInspectionPassed: false
        });
        await driver2Profile.save();
        console.log('✅ Created drivers and profiles');
        const ride1 = new Ride_1.default({
            userId: user1._id,
            driverId: driver1._id,
            pickupLocation: {
                address: 'Mumbai Airport, Mumbai, Maharashtra',
                lat: 19.0896,
                lng: 72.8656
            },
            dropLocation: {
                address: 'Gateway of India, Mumbai, Maharashtra',
                lat: 18.9217,
                lng: 72.8347
            },
            distanceKm: 12.5,
            estimatedFare: 450,
            actualFare: 450,
            paymentStatus: 'paid',
            status: 'completed',
            requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            acceptedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 2 * 60 * 1000),
            startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
            completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
            ratingByUser: 5,
            ratingByDriver: 4
        });
        await ride1.save();
        const ride2 = new Ride_1.default({
            userId: user2._id,
            driverId: driver1._id,
            pickupLocation: {
                address: 'Bandra West, Mumbai, Maharashtra',
                lat: 19.0596,
                lng: 72.8295
            },
            dropLocation: {
                address: 'Andheri West, Mumbai, Maharashtra',
                lat: 19.1197,
                lng: 72.8464
            },
            distanceKm: 8.2,
            estimatedFare: 320,
            paymentStatus: 'pending',
            status: 'requested',
            requestedAt: new Date()
        });
        await ride2.save();
        const ride3 = new Ride_1.default({
            userId: user1._id,
            driverId: driver2._id,
            pickupLocation: {
                address: 'Juhu Beach, Mumbai, Maharashtra',
                lat: 19.0996,
                lng: 72.8347
            },
            dropLocation: {
                address: 'Worli, Mumbai, Maharashtra',
                lat: 19.0179,
                lng: 72.8478
            },
            distanceKm: 15.8,
            estimatedFare: 580,
            paymentStatus: 'pending',
            status: 'cancelled',
            requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            cancelledAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000)
        });
        await ride3.save();
        console.log('✅ Created rides');
        const payment1 = new Payment_1.default({
            rideId: ride1._id,
            userId: user1._id,
            driverId: driver1._id,
            amount: 450,
            currency: 'INR',
            razorpayOrderId: 'order_123456789',
            razorpayPaymentId: 'pay_123456789',
            status: 'paid',
            paymentMethod: 'card'
        });
        await payment1.save();
        const payment2 = new Payment_1.default({
            rideId: ride2._id,
            userId: user2._id,
            driverId: driver1._id,
            amount: 320,
            currency: 'INR',
            razorpayOrderId: 'order_987654321',
            status: 'pending',
            paymentMethod: 'card'
        });
        await payment2.save();
        console.log('✅ Created payments');
        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Sample Data Created:');
        console.log(`👤 Admin User: admin@uberclone.com / admin123`);
        console.log(`👤 Normal Users: john@example.com / user123, jane@example.com / user123`);
        console.log(`🚗 Drivers: mike@example.com / driver123 (APPROVED), sarah@example.com / driver123 (PENDING)`);
        console.log(`🚖 Rides: 3 rides with different statuses`);
        console.log(`💳 Payments: 2 payments (1 paid, 1 pending)`);
        console.log('\n🔑 Use these credentials to test the application');
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}
seedDatabase();
//# sourceMappingURL=seed.js.map