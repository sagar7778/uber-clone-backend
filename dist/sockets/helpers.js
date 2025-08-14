"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToDriver = exports.emitToUser = exports.emitToRideRoom = exports.emitToNearbyDrivers = exports.initializeSocketHelpers = void 0;
let io;
const initializeSocketHelpers = (socketServer) => {
    io = socketServer;
};
exports.initializeSocketHelpers = initializeSocketHelpers;
const emitToNearbyDrivers = (pickupLat, pickupLng, event, payload) => {
    if (!io) {
        console.warn('Socket.IO not initialized, cannot emit to nearby drivers');
        return;
    }
    io.to('drivers').emit(event, payload);
    console.log(`Emitted ${event} to nearby drivers at (${pickupLat}, ${pickupLng})`);
};
exports.emitToNearbyDrivers = emitToNearbyDrivers;
const emitToRideRoom = (rideId, event, payload) => {
    if (!io) {
        console.warn('Socket.IO not initialized, cannot emit to ride room');
        return;
    }
    io.to(`ride:${rideId}`).emit(event, payload);
    console.log(`Emitted ${event} to ride room: ${rideId}`);
};
exports.emitToRideRoom = emitToRideRoom;
const emitToUser = (userId, event, payload) => {
    if (!io) {
        console.warn('Socket.IO not initialized, cannot emit to user');
        return;
    }
    io.to(`user:${userId}`).emit(event, payload);
    console.log(`Emitted ${event} to user: ${userId}`);
};
exports.emitToUser = emitToUser;
const emitToDriver = (driverId, event, payload) => {
    if (!io) {
        console.warn('Socket.IO not initialized, cannot emit to driver');
        return;
    }
    io.to(`driver:${driverId}`).emit(event, payload);
    console.log(`Emitted ${event} to driver: ${driverId}`);
};
exports.emitToDriver = emitToDriver;
//# sourceMappingURL=helpers.js.map