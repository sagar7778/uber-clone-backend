/**
 * Test script for debugging signup functionality
 * Run with: node test-signup.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000/api/auth';

async function testHealthCheck() {
  try {
    console.log('🏥 Testing health check...');
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.response?.data || error.message);
    return false;
  }
}

async function testUserSignup() {
  try {
    console.log('\n👤 Testing user signup...');
    const userData = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      phone: '1234567890',
      role: 'user'
    };
    
    const response = await axios.post(`${API_BASE}/signup`, userData);
    console.log('✅ User signup successful:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ User signup failed:', error.response?.data || error.message);
    return false;
  }
}

async function testDriverSignup() {
  try {
    console.log('\n🚗 Testing driver signup...');
    const driverData = {
      name: 'Test Driver',
      email: 'testdriver@example.com',
      password: 'password123',
      phone: '9876543210',
      role: 'driver',
      licenseNumber: 'LIC123456',
      licenseImage: 'https://via.placeholder.com/300x200?text=License',
      vehicleType: 'sedan',
      vehicleModel: 'Toyota Camry',
      vehicleNumber: 'ABC123',
      vehicleImage: 'https://via.placeholder.com/300x200?text=Vehicle',
      currentLat: 23.0225,
      currentLng: 72.5714
    };
    
    const response = await axios.post(`${API_BASE}/signup`, driverData);
    console.log('✅ Driver signup successful:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Driver signup failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting signup tests...\n');
  
  // Test health check first
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Health check failed. Backend might not be running or database connection failed.');
    console.log('Please check:');
    console.log('1. Backend is running (npm run dev)');
    console.log('2. MongoDB is running');
    console.log('3. Environment variables are set correctly');
    return;
  }
  
  // Test user signup
  await testUserSignup();
  
  // Test driver signup
  await testDriverSignup();
  
  console.log('\n🎉 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testHealthCheck, testUserSignup, testDriverSignup };
