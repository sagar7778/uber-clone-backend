import express from 'express';
import { createOrder, verifyPayment, getPaymentDetails } from '../controllers/paymentController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

// All payment routes require authentication
router.use(authenticate);

// Create Razorpay order
router.post('/create-order', createOrder);

// Verify payment signature
router.post('/verify', verifyPayment);

// Get payment details
router.get('/:paymentId', getPaymentDetails);

export default router;
