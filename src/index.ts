import { connectDB } from './db/mongoose';
import { app, httpServer } from './app';
import { initializeSocketIO } from './sockets';

/**
 * Bootstrap function to initialize database connection and start server
 */
async function bootstrap() {
  try {
    console.log('🚀 Starting Uber Clone Backend...');
    
    // Connect to MongoDB
    await connectDB();
    
    console.log('✅ Database connection established successfully');
    
    // Initialize Socket.IO
    const io = initializeSocketIO(httpServer);
    
    // Start HTTP server (with Socket.IO)
    const PORT = process.env.PORT_BACKEND || 4000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Express server running on port ${PORT}`);
      console.log(`📝 API available at http://localhost:${PORT}`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`🚗 Ride endpoints: http://localhost:${PORT}/api/rides`);
      console.log(`👨‍💼 Driver endpoints: http://localhost:${PORT}/api/driver`);
      console.log(`🔌 Socket.IO initialized and ready`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

// Run bootstrap if this file is executed directly
if (require.main === module) {
  bootstrap();
}

export default bootstrap;
