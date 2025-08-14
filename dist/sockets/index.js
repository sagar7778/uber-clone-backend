"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectedDriversCount = exports.getConnectedUsersCount = exports.getDriverSocketId = exports.getUserSocketId = exports.initializeSocketIO = void 0;
const socket_io_1 = require("socket.io");
const models_1 = require("../models");
const helpers_1 = require("./helpers");
const socketUserMap = new Map();
const socketDriverMap = new Map();
const pendingRides = new Map();
const initializeSocketIO = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
            credentials: true
        }
    });
    (0, helpers_1.initializeSocketHelpers)(io);
    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);
        socket.on('driver:join', async (data) => {
            try {
                const { driverId, location } = data;
                socket.join('drivers');
                socket.join(`driver:${driverId}`);
                socketDriverMap.set(socket.id, driverId);
                if (location) {
                    await models_1.Driver.findOneAndUpdate({ userId: driverId }, {
                        'currentLocation.lat': location.lat,
                        'currentLocation.lng': location.lng,
                        'currentLocation.updatedAt': new Date()
                    });
                }
                console.log(`🚗 Driver ${driverId} joined`);
                socket.emit('driver:joined', { success: true, message: 'Successfully joined drivers room' });
            }
            catch (error) {
                console.error('Driver join error:', error);
                socket.emit('driver:joined', { success: false, message: 'Failed to join drivers room' });
            }
        });
        socket.on('driver:location', async (data) => {
            try {
                const { rideId, driverId, lat, lng } = data;
                await models_1.Driver.findOneAndUpdate({ userId: driverId }, {
                    'currentLocation.lat': lat,
                    'currentLocation.lng': lng,
                    'currentLocation.updatedAt': new Date()
                });
                const payload = {
                    rideId,
                    driverId,
                    lat,
                    lng,
                    updatedAt: new Date()
                };
                if (rideId) {
                    socket.to(`ride:${rideId}`).emit('driver:location', payload);
                }
                else {
                    socket.to('users').emit('driver:location', payload);
                }
                console.log(`📍 Driver ${driverId} location updated: (${lat}, ${lng}) rideId=${rideId || 'N/A'}`);
            }
            catch (error) {
                console.error('Driver location update error:', error);
            }
        });
        socket.on('user:subscribeRide', (data) => {
            try {
                const { userId, rideId } = data;
                socket.join(`ride:${rideId}`);
                socket.join(`user:${userId}`);
                socketUserMap.set(socket.id, userId);
                console.log(`👤 User ${userId} subscribed to ride ${rideId}`);
                socket.emit('user:subscribed', {
                    success: true,
                    message: `Subscribed to ride ${rideId}`
                });
            }
            catch (error) {
                console.error('User subscription error:', error);
                socket.emit('user:subscribed', {
                    success: false,
                    message: 'Failed to subscribe to ride'
                });
            }
        });
        socket.on('user:join', (data) => {
            try {
                const { userId } = data;
                socket.join('users');
                socket.join(`user:${userId}`);
                socketUserMap.set(socket.id, userId);
                console.log(`👤 User ${userId} joined users room`);
                console.log(`👤 User ${userId} socket rooms:`, Array.from(socket.rooms));
                socket.emit('user:joined', {
                    success: true,
                    message: 'Successfully joined users room'
                });
            }
            catch (error) {
                console.error('User join error:', error);
                socket.emit('user:joined', {
                    success: false,
                    message: 'Failed to join users room'
                });
            }
        });
        socket.on('user:subscribeNearby', (data) => {
            try {
                const { userId, lat, lng } = data;
                socket.join(`users_nearby:${userId}`);
                console.log(`👤 User ${userId} subscribed to nearby drivers at (${lat}, ${lng})`);
                socket.emit('user:nearby_subscribed', {
                    success: true,
                    message: 'Subscribed to nearby drivers'
                });
            }
            catch (error) {
                console.error('User nearby subscription error:', error);
                socket.emit('user:nearby_subscribed', {
                    success: false,
                    message: 'Failed to subscribe to nearby drivers'
                });
            }
        });
        socket.on('ride:request', (rideData) => {
            try {
                console.log('🚗 New ride request received:', rideData);
                const rideId = Date.now().toString();
                const enriched = { id: rideId, ...rideData, createdAt: new Date() };
                pendingRides.set(rideId, enriched);
                socket.to('drivers').emit('ride:request', enriched);
                socket.emit('ride:requested', {
                    success: true,
                    message: 'Ride request sent to drivers',
                    rideId
                });
            }
            catch (error) {
                console.error('Ride request error:', error);
                socket.emit('ride:requested', {
                    success: false,
                    message: 'Failed to send ride request'
                });
            }
        });
        socket.on('ride:accept', async (data) => {
            try {
                const { rideId, driverId } = data;
                console.log(`✅ Driver ${driverId} accepted ride ${rideId}`);
                const driver = await models_1.Driver.findOne({ userId: driverId }).populate('userId');
                const pending = pendingRides.get(rideId);
                const passengerId = pending?.passengerId;
                const passenger = passengerId ? await models_1.User.findById(passengerId) : null;
                if (pending && !pending.driverId) {
                    pending.driverId = driverId;
                    pendingRides.set(rideId, pending);
                }
                const notificationData = {
                    rideId,
                    driverId,
                    status: 'accepted',
                    message: 'Your ride has been accepted by a driver!',
                    ...(pending || {}),
                    driver: driver ? {
                        name: driver.name || 'Driver',
                        phone: driver.phone || 'N/A',
                        rating: driver.rating || 5.0,
                        vehicle: {
                            model: driver.vehicleModel || 'Vehicle',
                            plate: driver.vehicleNumber || 'ABC-123',
                            color: 'Black'
                        }
                    } : null,
                    passenger: passenger ? {
                        id: passenger._id?.toString?.() || passengerId,
                        name: passenger.name,
                        email: passenger.email,
                        phone: passenger.phone || 'N/A',
                        isVerified: passenger.isVerified ?? false,
                        profileImage: passenger.profileImage || null,
                        createdAt: passenger.createdAt || null
                    } : (pending ? {
                        id: passengerId,
                        name: pending.passengerName,
                        phone: pending.passengerPhone
                    } : null)
                };
                console.log('📤 Sending ride:accepted notification', { to: passengerId ? `user:${passengerId}` : 'users', notificationData });
                socket.join(`ride:${rideId}`);
                if (passengerId) {
                    socket.to(`user:${passengerId}`).emit('ride:accepted', notificationData);
                }
                else {
                    socket.to('users').emit('ride:accepted', notificationData);
                }
                const driverPayload = {
                    ...notificationData,
                    id: pending?.id || rideId
                };
                socket.to(`driver:${driverId}`).emit('ride:accepted', driverPayload);
            }
            catch (error) {
                console.error('Ride acceptance error:', error);
            }
        });
        socket.on('passenger:location', (data) => {
            try {
                const { rideId, passengerId, lat, lng } = data;
                const pending = pendingRides.get(rideId);
                const driverId = pending?.driverId;
                const payload = { rideId, passengerId, lat, lng, updatedAt: new Date() };
                socket.to(`ride:${rideId}`).emit('passenger:location', payload);
                if (driverId) {
                    socket.to(`driver:${driverId}`).emit('passenger:location', payload);
                }
                console.log(`📍 Passenger ${passengerId} location update for ride ${rideId}: (${lat}, ${lng})`);
            }
            catch (error) {
                console.error('Passenger location update error:', error);
            }
        });
        socket.on('ride:ack', (data) => {
            try {
                const { rideId, passengerId } = data;
                const pending = pendingRides.get(rideId);
                const driverId = pending?.driverId;
                console.log(`✅ Passenger ${passengerId} acknowledged ride ${rideId}`);
                socket.join(`ride:${rideId}`);
                if (driverId) {
                    socket.to(`driver:${driverId}`).emit('ride:acknowledged', { rideId, passengerId });
                }
            }
            catch (error) {
                console.error('Ride acknowledgement error:', error);
            }
        });
        socket.on('ride:reject', (data) => {
            try {
                const { rideId, driverId } = data;
                console.log(`❌ Driver ${driverId} rejected ride ${rideId}`);
            }
            catch (error) {
                console.error('Ride rejection error:', error);
            }
        });
        socket.on('ride:start', (data) => {
            try {
                const { rideId, driverId } = data;
                console.log(`🚀 Driver ${driverId} started ride ${rideId}`);
                socket.to('users').emit('ride:started', {
                    rideId,
                    driverId,
                    status: 'started',
                    message: 'Your ride has started!'
                });
            }
            catch (error) {
                console.error('Ride start error:', error);
            }
        });
        socket.on('ride:complete', (data) => {
            try {
                const { rideId, driverId, finalPrice, distance, duration } = data;
                console.log(`🏁 Driver ${driverId} completed ride ${rideId}`);
                socket.to('users').emit('ride:completed', {
                    rideId,
                    driverId,
                    status: 'completed',
                    finalPrice,
                    distance,
                    duration,
                    message: 'Your ride has been completed!'
                });
            }
            catch (error) {
                console.error('Ride completion error:', error);
            }
        });
        socket.on('driver:status', (statusData) => {
            try {
                const { isOnline, isAvailable, currentLocation } = statusData;
                console.log(`📊 Driver status update:`, statusData);
                socket.to('users').emit('driver:status_changed', statusData);
            }
            catch (error) {
                console.error('Driver status update error:', error);
            }
        });
        socket.on('driver:location', (locationData) => {
            try {
                const { lat, lng, address, timestamp } = locationData;
                console.log(`📍 Driver location update:`, locationData);
                socket.to('users').emit('driver:location', locationData);
            }
            catch (error) {
                console.error('Driver location update error:', error);
            }
        });
        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.id}`);
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
        socket.on('error', (error) => {
            console.error(`❌ Socket error for ${socket.id}:`, error);
        });
    });
    io.use((socket, next) => {
        next();
    });
    console.log('🚀 Socket.IO server initialized');
    return io;
};
exports.initializeSocketIO = initializeSocketIO;
const getUserSocketId = (userId) => {
    for (const [socketId, id] of socketUserMap.entries()) {
        if (id === userId) {
            return socketId;
        }
    }
    return undefined;
};
exports.getUserSocketId = getUserSocketId;
const getDriverSocketId = (driverId) => {
    for (const [socketId, id] of socketDriverMap.entries()) {
        if (id === driverId) {
            return socketId;
        }
    }
    return undefined;
};
exports.getDriverSocketId = getDriverSocketId;
const getConnectedUsersCount = () => {
    return socketUserMap.size;
};
exports.getConnectedUsersCount = getConnectedUsersCount;
const getConnectedDriversCount = () => {
    return socketDriverMap.size;
};
exports.getConnectedDriversCount = getConnectedDriversCount;
//# sourceMappingURL=index.js.map