"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rideController_1 = require("../controllers/rideController");
const middlewares_1 = require("../middlewares");
const router = (0, express_1.Router)();
router.get('/estimate', rideController_1.estimateFare);
router.post('/request', middlewares_1.authenticate, rideController_1.requestRide);
router.get('/:id', rideController_1.getRide);
router.post('/:id/cancel', middlewares_1.authenticate, rideController_1.cancelRide);
router.post('/:id/status', middlewares_1.authenticate, (0, middlewares_1.requireRole)('driver'), rideController_1.updateRideStatus);
router.post('/:id/arrive', middlewares_1.authenticate, (0, middlewares_1.requireRole)('driver'), rideController_1.arriveRide);
router.post('/:id/start', middlewares_1.authenticate, (0, middlewares_1.requireRole)('driver'), rideController_1.startRideController);
router.post('/:id/complete', middlewares_1.authenticate, (0, middlewares_1.requireRole)('driver'), rideController_1.completeRideController);
router.post('/:id/rate', middlewares_1.authenticate, rideController_1.rateRide);
exports.default = router;
//# sourceMappingURL=ride.js.map