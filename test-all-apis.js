const axios = require('axios');

// Base URL for API calls
const BASE_URL = 'http://localhost:4000';

// Test data
const testData = {
  user: {
    name: 'Test User',
    email: 'user@test.com',
    password: 'password123',
    phone: '1234567890',
    role: 'user'
  },
  driver: {
    name: 'Test Driver',
    email: 'driver@test.com',
    password: 'password123',
    phone: '9876543210',
    licenseNumber: 'DL123456',
    vehicleType: 'sedan',
    vehicleModel: 'Toyota Camry',
    vehicleNumber: 'ABC123'
  },
  admin: {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'password123',
    phone: '5555555555',
    role: 'admin'
  }
};

// Test User Signup
async function testUserSignup() {
  try {
    console.log('🧪 Testing User Signup...');
    const response = await axios.post(`${BASE_URL}/api/auth/signup`, testData.user);
    console.log('✅ User Signup Success:', response.status);
    console.log('   Token:', response.data.data.token ? '✅ Present' : '❌ Missing');
    console.log('   User ID:', response.data.data.user._id ? '✅ Present' : '❌ Missing');
    return response.data.data.token;
  } catch (error) {
    console.error('❌ User Signup Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test Driver Signup
async function testDriverSignup() {
  try {
    console.log('\n🧪 Testing Driver Signup...');
    const response = await axios.post(`${BASE_URL}/api/auth/driver-signup`, testData.driver);
    console.log('✅ Driver Signup Success:', response.status);
    console.log('   Token:', response.data.data.token ? '✅ Present' : '❌ Missing');
    console.log('   Driver ID:', response.data.data.driver._id ? '✅ Present' : '❌ Missing');
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Driver Signup Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test Admin Signup
async function testAdminSignup() {
  try {
    console.log('\n🧪 Testing Admin Signup...');
    const response = await axios.post(`${BASE_URL}/api/auth/signup`, testData.admin);
    console.log('✅ Admin Signup Success:', response.status);
    console.log('   Token:', response.data.data.token ? '✅ Present' : '❌ Missing');
    console.log('   Admin ID:', response.data.data.user._id ? '✅ Present' : '❌ Missing');
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Admin Signup Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test User Login
async function testUserLogin() {
  try {
    console.log('\n🧪 Testing User Login...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testData.user.email,
      password: testData.user.password
    });
    console.log('✅ User Login Success:', response.status);
    console.log('   Token:', response.data.data.token ? '✅ Present' : '❌ Missing');
    console.log('   Role:', response.data.data.user.role);
    return response.data.data.token;
  } catch (error) {
    console.error('❌ User Login Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test Driver Login
async function testDriverLogin() {
  try {
    console.log('\n🧪 Testing Driver Login...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testData.driver.email,
      password: testData.driver.password
    });
    console.log('✅ Driver Login Success:', response.status);
    console.log('   Token:', response.data.data.token ? '✅ Present' : '❌ Missing');
    console.log('   Role:', response.data.data.user.role);
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Driver Login Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test Admin Login
async function testAdminLogin() {
  try {
    console.log('\n🧪 Testing Admin Login...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testData.admin.email,
      password: testData.admin.password
    });
    console.log('✅ Admin Login Success:', response.status);
    console.log('   Token:', response.data.data.token ? '✅ Present' : '❌ Missing');
    console.log('   Role:', response.data.data.user.role);
    return response.data.data.token;
  } catch (error) {
    console.error('❌ Admin Login Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test Protected Endpoints
async function testProtectedEndpoints(userToken, driverToken, adminToken) {
  console.log('\n🧪 Testing Protected Endpoints...');
  
  // Test /me endpoint with user token
  if (userToken) {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('✅ User /me endpoint:', response.status);
    } catch (error) {
      console.error('❌ User /me endpoint failed:', error.response?.data?.message || error.message);
    }
  }
  
  // Test /me endpoint with driver token
  if (driverToken) {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${driverToken}` }
      });
      console.log('✅ Driver /me endpoint:', response.status);
    } catch (error) {
      console.error('❌ Driver /me endpoint failed:', error.response?.data?.message || error.message);
    }
  }
  
  // Test /me endpoint with admin token
  if (adminToken) {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Admin /me endpoint:', response.status);
    } catch (error) {
      console.error('❌ Admin /me endpoint failed:', error.response?.data?.message || error.message);
    }
  }
}

// Test Health Check
async function testHealthCheck() {
  try {
    console.log('\n🧪 Testing Health Check...');
    const response = await axios.get(`${BASE_URL}/api/auth/health`);
    console.log('✅ Health Check Success:', response.status);
    console.log('   Database:', response.data.data.database);
    console.log('   User Count:', response.data.data.userCount);
    console.log('   Driver Count:', response.data.data.driverCount);
  } catch (error) {
    console.error('❌ Health Check Failed:', error.response?.data?.message || error.message);
  }
}

// Test Logout
async function testLogout(token, userType) {
  try {
    console.log(`\n🧪 Testing ${userType} Logout...`);
    const response = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ ${userType} Logout Success:`, response.status);
  } catch (error) {
    console.error(`❌ ${userType} Logout Failed:`, error.response?.data?.message || error.message);
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Tests...\n');
  
  // Test signups
  const userToken = await testUserSignup();
  const driverToken = await testDriverSignup();
  const adminToken = await testAdminSignup();
  
  // Test logins
  const userLoginToken = await testUserLogin();
  const driverLoginToken = await testDriverLogin();
  const adminLoginToken = await testAdminLogin();
  
  // Test health check
  await testHealthCheck();
  
  // Test protected endpoints
  await testProtectedEndpoints(userToken, driverToken, adminToken);
  
  // Test logouts
  if (userToken) await testLogout(userToken, 'User');
  if (driverToken) await testLogout(driverToken, 'Driver');
  if (adminToken) await testLogout(adminToken, 'Admin');
  
  console.log('\n🎉 All API tests completed!');
  console.log('\n📋 Summary:');
  console.log('   • User Signup:', userToken ? '✅ Success' : '❌ Failed');
  console.log('   • Driver Signup:', driverToken ? '✅ Success' : '❌ Failed');
  console.log('   • Admin Signup:', adminToken ? '✅ Success' : '❌ Failed');
  console.log('   • User Login:', userLoginToken ? '✅ Success' : '❌ Failed');
  console.log('   • Driver Login:', driverLoginToken ? '✅ Success' : '❌ Failed');
  console.log('   • Admin Login:', adminLoginToken ? '✅ Success' : '❌ Failed');
}

// Run tests
runAllTests().catch(console.error);
