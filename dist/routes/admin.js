"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middlewares/auth");
const roles_1 = require("../middlewares/roles");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.use((0, roles_1.requireRole)('admin'));
router.get('/dashboard', adminController_1.getDashboardStats);
router.get('/users', adminController_1.getAllUsers);
router.get('/drivers', adminController_1.getAllDrivers);
router.post('/drivers/:driverId/approve', adminController_1.approveDriver);
router.post('/drivers/:driverId/reject', adminController_1.rejectDriver);
router.get('/rides', adminController_1.getAllRides);
exports.default = router;
//# sourceMappingURL=admin.js.map