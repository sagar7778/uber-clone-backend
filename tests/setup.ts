import dotenv from 'dotenv';

// Load test environment variables (fallback to .env if .env.test doesn't exist)
dotenv.config({ path: '.env.test' });
dotenv.config(); // Load default .env as fallback

// Set test environment
(process.env as any).NODE_ENV = 'test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
});

afterAll(async () => {
  // Any global cleanup can go here
});
