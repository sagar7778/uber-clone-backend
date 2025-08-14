const axios = require('axios');

// Test driver signup API endpoint
async function testDriverSignupAPI() {
  try {
    console.log('🧪 Testing Driver Signup API...');
    
    const driverData = {
      name: 'Test Driver',
      email: 'driver@test.com',
      password: 'password123',
      phone: '1234567890',
      licenseNumber: 'DL123456',
      vehicleType: 'sedan',
      vehicleModel: 'Toyota Camry',
      vehicleNumber: 'TEST123'
    };

    console.log('📤 Sending driver signup request...');
    console.log('Data:', JSON.stringify(driverData, null, 2));

    const response = await axios.post('http://localhost:4000/api/auth/driver-signup', driverData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Driver signup successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Driver signup failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test user signup API endpoint
async function testUserSignupAPI() {
  try {
    console.log('\n🧪 Testing User Signup API...');
    
    const userData = {
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123',
      phone: '9876543210',
      role: 'user'
    };

    console.log('📤 Sending user signup request...');
    console.log('Data:', JSON.stringify(userData, null, 2));

    const response = await axios.post('http://localhost:4000/api/auth/signup', userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ User signup successful!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ User signup failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  await testDriverSignupAPI();
  await testUserSignupAPI();
  
  console.log('\n🎉 All tests completed!');
}

runTests();
