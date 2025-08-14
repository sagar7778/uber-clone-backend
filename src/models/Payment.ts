import mongoose, { Document, Schema } from 'mongoose';

/**
 * Payment status options
 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

/**
 * Payment document interface
 */
export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  rideId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: PaymentStatus;
  paymentMethod: 'card' | 'cash' | 'wallet';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment schema definition
 */
const paymentSchema = new Schema<IPayment>(
  {
    rideId: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'Ride ID is required']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Driver ID is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true
    },
    razorpayOrderId: {
      type: String,
      required: [true, 'Razorpay order ID is required'],
      unique: true,
      trim: true
    },
    razorpayPaymentId: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed', 'cancelled'],
        message: 'Payment status must be pending, paid, failed, or cancelled'
      },
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['card', 'cash', 'wallet'],
        message: 'Payment method must be card, cash, or wallet'
      },
      required: [true, 'Payment method is required']
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Create indexes
paymentSchema.index({ rideId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ driverId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ createdAt: -1 });

// Create and export the Payment model
const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
