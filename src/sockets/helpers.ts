import { Server as SocketIOServer } from 'socket.io';

/**
 * Socket.IO helper functions for ride management
 * These functions provide a clean interface for emitting events
 */

let io: SocketIOServer;

/**
 * Initialize the Socket.IO server reference
 * @param socketServer - The Socket.IO server instance
 */
export const initializeSocketHelpers = (socketServer: SocketIOServer): void => {
  io = socketServer;
};

/**
 * Emit event to nearby drivers
 * TODO: Implement geospatial filtering based on pickup coordinates
 * For now, broadcasts to all drivers in the 'drivers' room
 * 
 * @param pickupLat - Pickup latitude
 * @param pickupLng - Pickup longitude
 * @param event - Event name to emit
 * @param payload - Data to send
 */
export const emitToNearbyDrivers = (
  pickupLat: number,
  pickupLng: number,
  event: string,
  payload: any
): void => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit to nearby drivers');
    return;
  }

  // TODO: Implement geospatial filtering
  // 1. Query drivers within X km radius of pickup location
  // 2. Filter by availability and vehicle type
  // 3. Emit only to relevant driver rooms
  
  // For now, broadcast to all drivers
  io.to('drivers').emit(event, payload);
  
  console.log(`Emitted ${event} to nearby drivers at (${pickupLat}, ${pickupLng})`);
};

/**
 * Emit event to a specific ride room
 * @param rideId - The ride ID
 * @param event - Event name to emit
 * @param payload - Data to send
 */
export const emitToRideRoom = (
  rideId: string,
  event: string,
  payload: any
): void => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit to ride room');
    return;
  }

  io.to(`ride:${rideId}`).emit(event, payload);
  console.log(`Emitted ${event} to ride room: ${rideId}`);
};

/**
 * Emit event to a specific user
 * @param userId - The user ID
 * @param event - Event name to emit
 * @param payload - Data to send
 */
export const emitToUser = (
  userId: string,
  event: string,
  payload: any
): void => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit to user');
    return;
  }

  io.to(`user:${userId}`).emit(event, payload);
  console.log(`Emitted ${event} to user: ${userId}`);
};

/**
 * Emit event to a specific driver
 * @param driverId - The driver ID
 * @param event - Event name to emit
 * @param payload - Data to send
 */
export const emitToDriver = (
  driverId: string,
  event: string,
  payload: any
): void => {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit to driver');
    return;
  }

  io.to(`driver:${driverId}`).emit(event, payload);
  console.log(`Emitted ${event} to driver: ${driverId}`);
};
