const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Test script to verify driver signup works
async function testDriverSignup() {
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

    // Test driver creation with minimal required fields
    console.log('\n🧪 Testing driver creation...');
    const driverPassword = await bcrypt.hash('password123', 10);
    
    const driver = new Driver({
      name: 'Test Driver',
      email: 'driver@test.com',
      password: driverPassword,
      phone: '1234567890',
      licenseNumber: 'DL123456',
      vehicleType: 'sedan',
      vehicleModel: 'Test Car',
      vehicleNumber: 'TEST123'
    });

    console.log('💾 Saving driver...');
    await driver.save();
    console.log('✅ Driver saved successfully:', driver._id);

    // Verify driver data
    console.log('\n📋 Driver data verification:');
    console.log('   Name:', driver.name);
    console.log('   Email:', driver.email);
    console.log('   Phone:', driver.phone);
    console.log('   License:', driver.licenseNumber);
    console.log('   Vehicle:', driver.vehicleModel, driver.vehicleType);
    console.log('   Vehicle Number:', driver.vehicleNumber);
    console.log('   Rating:', driver.rating);
    console.log('   Available:', driver.isAvailable);

    // Check collections
    const userCount = await User.countDocuments();
    const driverCount = await Driver.countDocuments();
    
    console.log('\n📊 Collection counts:');
    console.log('   User collection:', userCount);
    console.log('   Driver collection:', driverCount);
    
    // Verify no cross-contamination
    const driverInUserCollection = await User.findOne({ email: 'driver@test.com' });
    console.log('🔍 Driver in User collection:', driverInUserCollection ? '❌ FOUND (BAD)' : '✅ NOT FOUND (GOOD)');

    console.log('\n🎉 Driver signup test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDriverSignup();
