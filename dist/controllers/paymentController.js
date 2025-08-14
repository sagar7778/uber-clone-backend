"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentDetails = exports.verifyPayment = exports.createOrder = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Ride_1 = __importDefault(require("../models/Ride"));
const createOrder = async (req, res) => {
    try {
        const { rideId, amount } = req.body;
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        if (!rideId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Ride ID and amount are required'
            });
        }
        const ride = await Ride_1.default.findById(rideId);
        if (!ride) {
            return res.status(404).json({
                success: false,
                message: 'Ride not found'
            });
        }
        if (ride.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to pay for this ride'
            });
        }
        const razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const payment = new Payment_1.default({
            rideId,
            userId,
            driverId: ride.driverId,
            amount,
            currency: 'INR',
            razorpayOrderId,
            status: 'pending',
            paymentMethod: 'card'
        });
        await payment.save();
        const orderDetails = {
            id: razorpayOrderId,
            amount: amount * 100,
            currency: 'INR',
            receipt: `receipt_${rideId}`,
            status: 'created'
        };
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                order: orderDetails,
                paymentId: payment._id
            }
        });
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.createOrder = createOrder;
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'All Razorpay parameters are required'
            });
        }
        const payment = await Payment_1.default.findOne({ razorpayOrderId: razorpay_order_id });
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        if (payment.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to verify this payment'
            });
        }
        const expectedSignature = crypto_1.default
            .createHmac('sha256', process.env.RAZORPAY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }
        payment.status = 'paid';
        payment.razorpayPaymentId = razorpay_payment_id;
        await payment.save();
        await Ride_1.default.findByIdAndUpdate(payment.rideId, {
            paymentStatus: 'paid'
        });
        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                paymentId: payment._id,
                status: payment.status,
                razorpayPaymentId: payment.razorpayPaymentId
            }
        });
    }
    catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.verifyPayment = verifyPayment;
const getPaymentDetails = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        const payment = await Payment_1.default.findById(paymentId)
            .populate('rideId', 'pickupLocation dropLocation status')
            .populate('driverId', 'vehicleModel vehicleNumber');
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }
        if (payment.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment'
            });
        }
        res.status(200).json({
            success: true,
            data: payment
        });
    }
    catch (error) {
        console.error('Error getting payment details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get payment details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getPaymentDetails = getPaymentDetails;
//# sourceMappingURL=paymentController.js.map