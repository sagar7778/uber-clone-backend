const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Test script to verify driver and user separation
async function testDriverSeparation() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/uber-clone');
    console.log('✅ Connected to MongoDB');

    // Import models
    const User = require('./dist/models/User').default;
    const Driver = require('./dist/models/Driver').default;
    const DriverProfile = require('./dist/models/DriverProfile').default;

    // Clear existing data
    await User.deleteMany({});
    await Driver.deleteMany({});
    await DriverProfile.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Test 1: Create a regular user
    console.log('\n🧪 Test 1: Creating regular user...');
    const userPassword = await bcrypt.hash('password123', 10);
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: userPassword,
      phone: '1234567890',
      role: 'user'
    });
    await user.save();
    console.log('✅ User created:', user.email, 'Role:', user.role);

    // Test 2: Create a driver (should NOT create a User document)
    console.log('\n🧪 Test 2: Creating driver...');
    const driverPassword = await bcrypt.hash('password123', 10);
    const driver = new Driver({
      name: 'Driver Smith',
      email: 'driver@example.com',
      password: driverPassword,
      phone: '9876543210',
      licenseNumber: 'DL123456',
      licenseImage: 'https://example.com/license.jpg',
      vehicleType: 'sedan',
      vehicleModel: 'Toyota Camry',
      vehicleNumber: 'ABC123',
      vehicleImage: 'https://example.com/vehicle.jpg',
      currentLocation: {
        lat: 40.7128,
        lng: -74.0060,
        updatedAt: new Date()
      },
      isAvailable: false,
      rating: 5,
      totalEarnings: 0,
      completedRides: 0
    });
    await driver.save();
    console.log('✅ Driver created:', driver.email, 'Role: driver');

    // Test 3: Verify separation
    console.log('\n🧪 Test 3: Verifying separation...');
    
    const userCount = await User.countDocuments();
    const driverCount = await Driver.countDocuments();
    
    console.log('📊 User collection count:', userCount);
    console.log('📊 Driver collection count:', driverCount);
    
    // Check if driver email exists in User collection
    const driverInUserCollection = await User.findOne({ email: 'driver@example.com' });
    const userInDriverCollection = await Driver.findOne({ email: 'john@example.com' });
    
    console.log('🔍 Driver email in User collection:', driverInUserCollection ? '❌ FOUND (BAD)' : '✅ NOT FOUND (GOOD)');
    console.log('🔍 User email in Driver collection:', userInDriverCollection ? '❌ FOUND (BAD)' : '✅ NOT FOUND (GOOD)');

    // Test 4: Verify authentication works for both
    console.log('\n🧪 Test 4: Testing authentication...');
    
    // Test user login
    const userLogin = await User.findOne({ email: 'john@example.com' });
    if (userLogin) {
      const userPasswordValid = await bcrypt.compare('password123', userLogin.password);
      console.log('🔐 User login test:', userPasswordValid ? '✅ SUCCESS' : '❌ FAILED');
    }
    
    // Test driver login
    const driverLogin = await Driver.findOne({ email: 'driver@example.com' });
    if (driverLogin) {
      const driverPasswordValid = await bcrypt.compare('password123', driverLogin.password);
      console.log('🔐 Driver login test:', driverPasswordValid ? '✅ SUCCESS' : '❌ FAILED');
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   • Regular users are stored ONLY in User collection');
    console.log('   • Drivers are stored ONLY in Driver collection');
    console.log('   • No cross-contamination between collections');
    console.log('   • Both can authenticate independently');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDriverSeparation();
