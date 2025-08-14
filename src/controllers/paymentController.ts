import { Request, Response } from 'express';
import crypto from 'crypto';
import Payment from '../models/Payment';
import Ride from '../models/Ride';
import { IUser } from '../models/User';

// Extend Request to include user
interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Create a Razorpay order for payment
 * POST /api/payments/create-order
 */
export const createOrder = async (req: AuthRequest, res: Response) => {
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

    // Verify ride exists and belongs to user
    const ride = await Ride.findById(rideId);
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

    // Generate unique order ID
    const razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = new Payment({
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

    // In a real implementation, you would call Razorpay API here
    // For now, we'll return a mock order
    const orderDetails = {
      id: razorpayOrderId,
      amount: amount * 100, // Razorpay expects amount in paise
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

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify Razorpay payment signature and update payment status
 * POST /api/payments/verify
 */
export const verifyPayment = async (req: AuthRequest, res: Response) => {
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

    // Find payment by order ID
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
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

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update payment status
    payment.status = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    await payment.save();

    // Update ride payment status
    await Ride.findByIdAndUpdate(payment.rideId, {
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

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get payment details by ID
 * GET /api/payments/:paymentId
 */
export const getPaymentDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const payment = await Payment.findById(paymentId)
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

  } catch (error) {
    console.error('Error getting payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
