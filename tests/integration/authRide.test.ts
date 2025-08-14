import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app';
import User from '../../src/models/User';
import Driver from '../../src/models/Driver';
import Ride from '../../src/models/Ride';
import bcrypt from 'bcryptjs';

describe('Auth & Ride Integration Tests', () => {
  let testUser: any;
  let testDriver: any;
  let authToken: string;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/uber-clone-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and disconnect
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await User.deleteMany({});
    await Driver.deleteMany({});
    await Ride.deleteMany({});
  });

  describe('User Registration and Authentication', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.role).toBe('user');
      expect(response.body.data.user.password).toBeUndefined();

      // Verify user was saved to database
      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeTruthy();
      expect(savedUser?.name).toBe(userData.name);
    });

    it('should login user and return JWT token', async () => {
      // Create a test user first
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        phone: '1234567890',
        role: 'user'
      });

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);

      authToken = response.body.data.token;
    });

    it('should reject invalid login credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('Ride Request Flow', () => {
    beforeEach(async () => {
      // Create test user and driver for ride tests
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        phone: '1234567890',
        role: 'user'
      });

      testDriver = await Driver.create({
        userId: testUser._id, // Using same user for simplicity in test
        licenseNumber: 'DL123456789',
        licenseImage: 'https://example.com/license.jpg',
        vehicleType: 'sedan',
        vehicleModel: 'Toyota Camry',
        vehicleNumber: 'MH12AB1234',
        vehicleImage: 'https://example.com/car.jpg',
        rating: 4.8,
        isAvailable: true,
        currentLocation: {
          lat: 19.0760,
          lng: 72.8777,
          updatedAt: new Date()
        },
        totalEarnings: 0,
        completedRides: 0
      });

      // Login to get auth token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.data.token;
    });

    it('should create a ride request successfully', async () => {
      const rideData = {
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
        estimatedFare: 450
      };

      const response = await request(app)
        .post('/api/rides/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rideData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ride.pickupLocation.address).toBe(rideData.pickupLocation.address);
      expect(response.body.data.ride.dropLocation.address).toBe(rideData.dropLocation.address);
      expect(response.body.data.ride.estimatedFare).toBe(rideData.estimatedFare);
      expect(response.body.data.ride.status).toBe('requested');
      expect(response.body.data.ride.paymentStatus).toBe('pending');

      // Verify ride was saved to database
      const savedRide = await Ride.findById(response.body.data.ride._id);
      expect(savedRide).toBeTruthy();
      expect(savedRide?.userId.toString()).toBe(testUser._id.toString());
      expect(savedRide?.driverId.toString()).toBe(testDriver._id.toString());
    });

    it('should reject ride request without authentication', async () => {
      const rideData = {
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
        estimatedFare: 450
      };

      const response = await request(app)
        .post('/api/rides/request')
        .send(rideData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should reject ride request with invalid data', async () => {
      const invalidRideData = {
        pickupLocation: {
          address: 'Mumbai Airport, Mumbai, Maharashtra',
          lat: 19.0896,
          lng: 72.8656
        }
        // Missing dropLocation and other required fields
      };

      const response = await request(app)
        .post('/api/rides/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRideData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation failed');
    });
  });

  describe('Protected Route Access', () => {
    it('should allow access to protected routes with valid token', async () => {
      // Create and login user
      const hashedPassword = await bcrypt.hash('password123', 12);
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        phone: '1234567890',
        role: 'user'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.data.token;

      // Test accessing a protected route
      const response = await request(app)
        .get('/api/rides/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject access to protected routes without token', async () => {
      const response = await request(app)
        .get('/api/rides/user')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });
});
