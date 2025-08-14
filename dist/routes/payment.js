"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.post('/create-order', paymentController_1.createOrder);
router.post('/verify', paymentController_1.verifyPayment);
router.get('/:paymentId', paymentController_1.getPaymentDetails);
exports.default = router;
//# sourceMappingURL=payment.js.map