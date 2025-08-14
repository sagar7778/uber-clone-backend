import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Driver, User } from '../models';
import { initializeSocketHelpers } from './helpers';

/**
 * Socket.IO server setup for real-time communication
 * Handles driver and user connections, location updates, and ride management
 */

// In-memory mapping for socketId -> userId
// TODO: For production, use Redis adapter for scalability across multiple server instances
const socketUserMap = new Map<string, string>();
const socketDriverMap = new Map<string, string>();
// Track pending rides so we can route accept/updates to the right passenger/room
const pendingRides = new Map<string, any>();

/**
 * Initialize Socket.IO server
 * @param httpServer - The HTTP server instance
 * @returns Socket.IO server instance
 */
export const initializeSocketIO = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // Initialize socket helpers
  initializeSocketHelpers(io);

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Driver joins and location updates
    socket.on('driver:join', async (data: { driverId: string; location?: any }) => {
      try {
        const { driverId, location } = data;
        
        // Join driver rooms
        socket.join('drivers');
        socket.join(`driver:${driverId}`);
        
        // Store mapping
        socketDriverMap.set(socket.id, driverId);
        
        // Update driver location in database if provided
        if (location) {
          await Driver.findOneAndUpdate(
            { userId: driverId },
            {
              'currentLocation.lat': location.lat,
              'currentLocation.lng': location.lng,
              'currentLocation.updatedAt': new Date()
            }
          );
        }
        
        console.log(`🚗 Driver ${driverId} joined`);
        
        // Acknowledge successful join
        socket.emit('driver:joined', { success: true, message: 'Successfully joined drivers room' });
        
      } catch (error) {
        console.error('Driver join error:', error);
        socket.emit('driver:joined', { success: false, message: 'Failed to join drivers room' });
      }
    });

    // Driver location updates (scoped to a ride)
    socket.on('driver:location', async (data: { rideId?: string; driverId: string; lat: number; lng: number }) => {
      try {
        const { rideId, driverId, lat, lng } = data;

        await Driver.findOneAndUpdate(
          { userId: driverId },
          {
            'currentLocation.lat': lat,
            'currentLocation.lng': lng,
            'currentLocation.updatedAt': new Date()
          }
        );

        const payload = {
          rideId,
          driverId,
          lat,
          lng,
          updatedAt: new Date()
        };

        if (rideId) {
          // Send only to participants of this ride
          socket.to(`ride:${rideId}`).emit('driver:location', payload);
        } else {
          // Fallback: broadcast broadly (legacy)
          socket.to('users').emit('driver:location', payload);
        }

        console.log(`📍 Driver ${driverId} location updated: (${lat}, ${lng}) rideId=${rideId || 'N/A'}`);
      } catch (error) {
        console.error('Driver location update error:', error);
      }
    });

    // User subscribes to ride updates
    socket.on('user:subscribeRide', (data: { userId: string; rideId: string }) => {
      try {
        const { userId, rideId } = data;
        
        // Join ride-specific room
        socket.join(`ride:${rideId}`);
        socket.join(`user:${userId}`);
        
        // Store mapping
        socketUserMap.set(socket.id, userId);
        
        console.log(`👤 User ${userId} subscribed to ride ${rideId}`);
        
        // Acknowledge successful subscription
        socket.emit('user:subscribed', { 
          success: true, 
          message: `Subscribed to ride ${rideId}` 
        });
        
      } catch (error) {
        console.error('User subscription error:', error);
        socket.emit('user:subscribed', { 
          success: false, 
          message: 'Failed to subscribe to ride' 
        });
      }
    });

    // User joins general users room
    socket.on('user:join', (data: { userId: string }) => {
      try {
        const { userId } = data;
        
        // Join users room
        socket.join('users');
        socket.join(`user:${userId}`);
        
        // Store mapping
        socketUserMap.set(socket.id, userId);
        
        console.log(`👤 User ${userId} joined users room`);
        console.log(`👤 User ${userId} socket rooms:`, Array.from(socket.rooms));
        
        // Acknowledge successful join
        socket.emit('user:joined', { 
          success: true, 
          message: 'Successfully joined users room' 
        });
        
      } catch (error) {
        console.error('User join error:', error);
        socket.emit('user:joined', { 
          success: false, 
          message: 'Failed to join users room' 
        });
      }
    });

    // User subscribes to nearby drivers
    socket.on('user:subscribeNearby', (data: { userId: string; lat: number; lng: number }) => {
      try {
        const { userId, lat, lng } = data;
        
        // Join nearby drivers room
        socket.join(`users_nearby:${userId}`);
        
        console.log(`👤 User ${userId} subscribed to nearby drivers at (${lat}, ${lng})`);
        
        // Acknowledge successful subscription
        socket.emit('user:nearby_subscribed', { 
          success: true, 
          message: 'Subscribed to nearby drivers' 
        });
        
      } catch (error) {
        console.error('User nearby subscription error:', error);
        socket.emit('user:nearby_subscribed', { 
          success: false, 
          message: 'Failed to subscribe to nearby drivers' 
        });
      }
    });

    // Ride request from passenger
    socket.on('ride:request', (rideData: any) => {
      try {
        console.log('🚗 New ride request received:', rideData);

        // Generate single rideId to use consistently
        const rideId = Date.now().toString();
        const enriched = { id: rideId, ...rideData, createdAt: new Date() };

        // Save to pending rides map
        pendingRides.set(rideId, enriched);

        // Broadcast ride request to all available drivers
        socket.to('drivers').emit('ride:request', enriched);

        // Acknowledge ride request with rideId
        socket.emit('ride:requested', {
          success: true,
          message: 'Ride request sent to drivers',
          rideId
        });
        
      } catch (error) {
        console.error('Ride request error:', error);
        socket.emit('ride:requested', { 
          success: false, 
          message: 'Failed to send ride request' 
        });
      }
    });

    // Driver accepts ride request
    socket.on('ride:accept', async (data: { rideId: string; driverId: string }) => {
      try {
        const { rideId, driverId } = data;
        console.log(`✅ Driver ${driverId} accepted ride ${rideId}`);
        
        // Get driver details from database
        const driver = await Driver.findOne({ userId: driverId }).populate('userId');
        const pending = pendingRides.get(rideId);
        const passengerId: string | undefined = pending?.passengerId;
        const passenger = passengerId ? await User.findById(passengerId) : null;
        // Persist driverId onto pending ride for later routing
        if (pending && !pending.driverId) {
          pending.driverId = driverId;
          pendingRides.set(rideId, pending);
        }
        
        // Notify the passenger that ride was accepted
        const notificationData = {
          rideId,
          driverId,
          status: 'accepted',
          message: 'Your ride has been accepted by a driver!',
          // Include full ride details so the passenger can render pickup/drop
          ...(pending || {}),
          driver: driver ? {
            name: driver.name || 'Driver',
            phone: driver.phone || 'N/A',
            rating: driver.rating || 5.0,
            vehicle: {
              model: driver.vehicleModel || 'Vehicle',
              plate: driver.vehicleNumber || 'ABC-123',
              color: 'Black' // TODO: Add color to driver model
            }
          } : null,
          passenger: passenger ? {
            id: passenger._id?.toString?.() || passengerId,
            name: passenger.name,
            email: passenger.email,
            phone: (passenger as any).phone || 'N/A',
            isVerified: (passenger as any).isVerified ?? false,
            profileImage: (passenger as any).profileImage || null,
            createdAt: (passenger as any).createdAt || null
          } : (pending ? {
            id: passengerId,
            name: pending.passengerName,
            phone: pending.passengerPhone
          } : null)
        };
        
        console.log('📤 Sending ride:accepted notification', { to: passengerId ? `user:${passengerId}` : 'users', notificationData });

        // Ensure driver joins ride room for scoped updates
        socket.join(`ride:${rideId}`);

        if (passengerId) {
          // Send only to that passenger (they'll join ride room upon receipt)
          socket.to(`user:${passengerId}`).emit('ride:accepted', notificationData);
        } else {
          // Fallback: broadcast to all users (legacy)
          socket.to('users').emit('ride:accepted', notificationData);
        }

        // Also notify the accepting driver with full ride details
        const driverPayload = {
          ...notificationData,
          // ensure id is present for driver UI controls that use currentRide.id
          id: pending?.id || rideId
        };
        socket.to(`driver:${driverId}`).emit('ride:accepted', driverPayload);
        
      } catch (error) {
        console.error('Ride acceptance error:', error);
      }
    });

    // Passenger location updates (scoped to a ride)
    socket.on('passenger:location', (data: { rideId: string; passengerId: string; lat: number; lng: number }) => {
      try {
        const { rideId, passengerId, lat, lng } = data;
        const pending = pendingRides.get(rideId);
        const driverId: string | undefined = pending?.driverId;

        const payload = { rideId, passengerId, lat, lng, updatedAt: new Date() };

        // Emit to ride participants
        socket.to(`ride:${rideId}`).emit('passenger:location', payload);
        if (driverId) {
          socket.to(`driver:${driverId}`).emit('passenger:location', payload);
        }

        console.log(`📍 Passenger ${passengerId} location update for ride ${rideId}: (${lat}, ${lng})`);
      } catch (error) {
        console.error('Passenger location update error:', error);
      }
    });
    // Passenger acknowledges acceptance (so driver sees confirmation)
    socket.on('ride:ack', (data: { rideId: string; passengerId: string }) => {
      try {
        const { rideId, passengerId } = data;
        const pending = pendingRides.get(rideId);
        const driverId: string | undefined = pending?.driverId;
        console.log(`✅ Passenger ${passengerId} acknowledged ride ${rideId}`);

        // Add both to ride room
        socket.join(`ride:${rideId}`);

        if (driverId) {
          socket.to(`driver:${driverId}`).emit('ride:acknowledged', { rideId, passengerId });
        }
      } catch (error) {
        console.error('Ride acknowledgement error:', error);
      }
    });

    // Driver rejects ride request
    socket.on('ride:reject', (data: { rideId: string; driverId: string }) => {
      try {
        const { rideId, driverId } = data;
        console.log(`❌ Driver ${driverId} rejected ride ${rideId}`);
        
        // Remove the ride request from driver's active requests
        // This is handled on the frontend
      } catch (error) {
        console.error('Ride rejection error:', error);
      }
    });

    // Driver starts ride
    socket.on('ride:start', (data: { rideId: string; driverId: string }) => {
      try {
        const { rideId, driverId } = data;
        console.log(`🚀 Driver ${driverId} started ride ${rideId}`);
        
        // Notify passenger that ride has started
        socket.to('users').emit('ride:started', {
          rideId,
          driverId,
          status: 'started',
          message: 'Your ride has started!'
        });
        
      } catch (error) {
        console.error('Ride start error:', error);
      }
    });

    // Driver completes ride
    socket.on('ride:complete', (data: { rideId: string; driverId: string; finalPrice: number; distance: number; duration: number }) => {
      try {
        const { rideId, driverId, finalPrice, distance, duration } = data;
        console.log(`🏁 Driver ${driverId} completed ride ${rideId}`);
        
        // Notify passenger that ride is completed
        socket.to('users').emit('ride:completed', {
          rideId,
          driverId,
          status: 'completed',
          finalPrice,
          distance,
          duration,
          message: 'Your ride has been completed!'
        });
        
      } catch (error) {
        console.error('Ride completion error:', error);
      }
    });

    // Driver status updates
    socket.on('driver:status', (statusData: any) => {
      try {
        const { isOnline, isAvailable, currentLocation } = statusData;
        console.log(`📊 Driver status update:`, statusData);
        
        // Update driver status in database
        // This would be handled by the driver controller
        
        // Notify relevant parties about status change
        socket.to('users').emit('driver:status_changed', statusData);
        
      } catch (error) {
        console.error('Driver status update error:', error);
      }
    });

    // Driver location updates
    socket.on('driver:location', (locationData: any) => {
      try {
        const { lat, lng, address, timestamp } = locationData;
        console.log(`📍 Driver location update:`, locationData);
        
        // Update driver location in database
        // This would be handled by the driver controller
        
        // Notify relevant parties about location change
        socket.to('users').emit('driver:location', locationData);
        
      } catch (error) {
        console.error('Driver location update error:', error);
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      
      // Clean up mappings
      const userId = socketUserMap.get(socket.id);
      const driverId = socketDriverMap.get(socket.id);
      
      if (userId) {
        socketUserMap.delete(socket.id);
        console.log(`👤 User ${userId} disconnected`);
      }
      
      if (driverId) {
        socketDriverMap.delete(socket.id);
        console.log(`🚗 Driver ${driverId} disconnected`);
      }
    });

    // Error handler
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  // Middleware for authentication (if needed)
  io.use((socket, next) => {
    // TODO: Implement JWT authentication for socket connections
    // For now, allow all connections
    next();
  });

  console.log('🚀 Socket.IO server initialized');
  return io;
};

/**
 * Get socket ID for a user
 * @param userId - The user ID
 * @returns Socket ID or undefined
 */
export const getUserSocketId = (userId: string): string | undefined => {
  for (const [socketId, id] of socketUserMap.entries()) {
    if (id === userId) {
      return socketId;
    }
  }
  return undefined;
};

/**
 * Get socket ID for a driver
 * @param driverId - The driver ID
 * @returns Socket ID or undefined
 */
export const getDriverSocketId = (driverId: string): string | undefined => {
  for (const [socketId, id] of socketDriverMap.entries()) {
    if (id === driverId) {
      return socketId;
    }
  }
  return undefined;
};

/**
 * Get all connected users count
 * @returns Number of connected users
 */
export const getConnectedUsersCount = (): number => {
  return socketUserMap.size;
};

/**
 * Get all connected drivers count
 * @returns Number of connected drivers
 */
export const getConnectedDriversCount = (): number => {
  return socketDriverMap.size;
};
