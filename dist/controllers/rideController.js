"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateRide = exports.completeRideController = exports.startRideController = exports.arriveRide = exports.updateRideStatus = exports.cancelRide = exports.getRide = exports.requestRide = exports.estimateFare = void 0;
const models_1 = require("../models");
const helpers_1 = require("../sockets/helpers");
const estimateFare = async (req, res) => {
    try {
        const { pickupLat, pickupLng, dropLat, dropLng, vehicleType = 'sedan' } = req.query;
        const lat1 = Number(pickupLat);
        const lon1 = Number(pickupLng);
        const lat2 = Number(dropLat);
        const lon2 = Number(dropLng);
        if ([lat1, lon1, lat2, lon2].some((v) => isNaN(v))) {
            res.status(400).json({ success: false, message: 'Invalid coordinates' });
            return;
        }
        const toRad = (x) => (x * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = Number((R * c).toFixed(2));
        const durationMin = Math.max(5, Math.round((distanceKm / 30) * 60));
        const baseFareByType = { sedan: 40, suv: 60, hatchback: 35, bike: 20, auto: 25 };
        const perKmByType = { sedan: 12, suv: 16, hatchback: 10, bike: 6, auto: 8 };
        const perMin = 1;
        const base = baseFareByType[vehicleType] ?? 40;
        const perKm = perKmByType[vehicleType] ?? 12;
        const estimatedFare = Number((base + distanceKm * perKm + durationMin * perMin).toFixed(2));
        res.status(200).json({ success: true, data: { distanceKm, durationMin, estimatedFare, vehicleType } });
    }
    catch (error) {
        console.error('Estimate fare error:', error);
        res.status(500).json({ success: false, message: 'Failed to estimate fare' });
    }
};
exports.estimateFare = estimateFare;
const requestRide = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const { pickupLocation, dropLocation, pickupLat, pickupLng, dropLat, dropLng, estimatedFare, distanceKm } = req.body;
        if (!pickupLocation || !dropLocation || !pickupLat || !pickupLng || !dropLat || !dropLng || !estimatedFare || !distanceKm) {
            res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
            return;
        }
        const ride = new models_1.Ride({
            userId,
            pickupLocation: {
                address: pickupLocation,
                lat: pickupLat,
                lng: pickupLng
            },
            dropLocation: {
                address: dropLocation,
                lat: dropLat,
                lng: dropLng
            },
            estimatedFare,
            distanceKm,
            status: 'requested',
            requestedAt: new Date()
        });
        await ride.save();
        const rideSummary = {
            rideId: ride._id,
            pickupLocation: ride.pickupLocation,
            dropLocation: ride.dropLocation,
            estimatedFare: ride.estimatedFare,
            distanceKm: ride.distanceKm,
            requestedAt: ride.requestedAt
        };
        (0, helpers_1.emitToNearbyDrivers)(pickupLat, pickupLng, 'ride:request', rideSummary);
        res.status(201).json({
            success: true,
            message: 'Ride requested successfully',
            data: {
                ride
            }
        });
    }
    catch (error) {
        console.error('Request ride error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during ride request'
        });
    }
};
exports.requestRide = requestRide;
const getRide = async (req, res) => {
    try {
        const { id } = req.params;
        const ride = await models_1.Ride.findById(id)
            .populate('userId', 'name email phone')
            .populate('driverId', 'vehicleType vehicleModel vehicleNumber rating');
        if (!ride) {
            res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                ride
            }
        });
    }
    catch (error) {
        console.error('Get ride error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching ride'
        });
    }
};
exports.getRide = getRide;
const cancelRide = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const { id } = req.params;
        const ride = await models_1.Ride.findById(id);
        if (!ride) {
            res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
            return;
        }
        const canCancel = ride.userId.toString() === userId ||
            (userRole === 'driver' && ride.driverId?.toString() === userId) ||
            userRole === 'admin';
        if (!canCancel) {
            res.status(403).json({
                success: false,
                message: 'You are not authorized to cancel this ride'
            });
            return;
        }
        if (['completed', 'cancelled'].includes(ride.status)) {
            res.status(400).json({
                success: false,
                message: 'Ride cannot be cancelled in its current status'
            });
            return;
        }
        ride.status = 'cancelled';
        ride.cancelledAt = new Date();
        await ride.save();
        (0, helpers_1.emitToRideRoom)(ride._id.toString(), 'ride:status', {
            rideId: ride._id,
            status: ride.status,
            cancelledAt: ride.cancelledAt
        });
        res.status(200).json({
            success: true,
            message: 'Ride cancelled successfully',
            data: {
                ride
            }
        });
    }
    catch (error) {
        console.error('Cancel ride error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while cancelling ride'
        });
    }
};
exports.cancelRide = cancelRide;
const updateRideStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (userRole !== 'driver') {
            res.status(403).json({
                success: false,
                message: 'Only drivers can update ride status'
            });
            return;
        }
        const { id } = req.params;
        const { status } = req.body;
        const ride = await models_1.Ride.findById(id);
        if (!ride) {
            res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
            return;
        }
        if (ride.driverId?.toString() !== userId) {
            res.status(403).json({
                success: false,
                message: 'You are not assigned to this ride'
            });
            return;
        }
        const validTransitions = {
            'accepted': ['on_the_way'],
            'on_the_way': ['arrived'],
            'arrived': ['in_progress'],
            'in_progress': ['completed']
        };
        if (!validTransitions[ride.status]?.includes(status)) {
            res.status(400).json({
                success: false,
                message: `Invalid status transition from ${ride.status} to ${status}`
            });
            return;
        }
        ride.status = status;
        switch (status) {
            case 'on_the_way':
                ride.startedAt = new Date();
                break;
            case 'arrived':
                break;
            case 'in_progress':
                break;
            case 'completed':
                ride.completedAt = new Date();
                break;
        }
        await ride.save();
        (0, helpers_1.emitToRideRoom)(ride._id.toString(), 'ride:status', {
            rideId: ride._id,
            status: ride.status,
            updatedAt: new Date()
        });
        res.status(200).json({
            success: true,
            message: 'Ride status updated successfully',
            data: {
                ride
            }
        });
    }
    catch (error) {
        console.error('Update ride status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating ride status'
        });
    }
};
exports.updateRideStatus = updateRideStatus;
const arriveRide = async (req, res) => {
    req.body.status = 'arrived';
    return (0, exports.updateRideStatus)(req, res);
};
exports.arriveRide = arriveRide;
const startRideController = async (req, res) => {
    req.body.status = 'in_progress';
    return (0, exports.updateRideStatus)(req, res);
};
exports.startRideController = startRideController;
const completeRideController = async (req, res) => {
    req.body.status = 'completed';
    return (0, exports.updateRideStatus)(req, res);
};
exports.completeRideController = completeRideController;
const rateRide = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { id } = req.params;
        const { rating = 5 } = req.body;
        if (rating < 1 || rating > 5) {
            res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
            return;
        }
        const ride = await models_1.Ride.findById(id);
        if (!ride) {
            res.status(404).json({ success: false, message: 'Ride not found' });
            return;
        }
        if (ride.userId.toString() !== userId) {
            res.status(403).json({ success: false, message: 'Only the passenger can rate this ride' });
            return;
        }
        if (ride.status !== 'completed') {
            res.status(400).json({ success: false, message: 'Ride must be completed before rating' });
            return;
        }
        if (!ride.driverId) {
            res.status(400).json({ success: false, message: 'No driver assigned to this ride' });
            return;
        }
        const driver = await models_1.Driver.findById(ride.driverId);
        if (!driver) {
            res.status(404).json({ success: false, message: 'Driver not found' });
            return;
        }
        const totalRatings = driver.completedRides || 0;
        const currentAvg = driver.rating || 5;
        const newAvg = (currentAvg * totalRatings + rating) / (totalRatings + 1);
        driver.rating = Number(newAvg.toFixed(2));
        await driver.save();
        res.status(200).json({ success: true, message: 'Thanks for your rating', data: { driverRating: driver.rating } });
    }
    catch (error) {
        console.error('Rate ride error:', error);
        res.status(500).json({ success: false, message: 'Failed to rate ride' });
    }
};
exports.rateRide = rateRide;
//# sourceMappingURL=rideController.js.map