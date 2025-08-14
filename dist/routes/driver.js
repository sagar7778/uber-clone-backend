"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driverController_1 = require("../controllers/driverController");
const middlewares_1 = require("../middlewares");
const router = (0, express_1.Router)();
router.get('/profile', middlewares_1.authenticate, (0, middlewares_1.requireRole)('driver'), driverController_1.getDriverProfile);
router.put('/profile', middlewares_1.authenticate, (0, middlewares_1.requireRole)('driver'), driverController_1.updateDriverProfile);
router.post('/accept/:rideId', middlewares_1.authenticate, (0, middlewares_1.requireRole)('driver'), driverController_1.acceptRide);
router.get('/rides', middlewares_1.authenticate, (0, middlewares_1.requireRole)('driver'), driverController_1.getDriverRides);
exports.default = router;
//# sourceMappingURL=driver.js.map