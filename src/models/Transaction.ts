import mongoose, { Document, Schema } from 'mongoose';

/**
 * Payment method options
 */
export type PaymentMethod = 'card' | 'cash' | 'wallet';

/**
 * Transaction status options
 */
export type TransactionStatus = 'pending' | 'paid' | 'failed';

/**
 * Transaction document interface
 */
export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  rideId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction schema definition
 */
const transactionSchema = new Schema<ITransaction>(
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
    paymentMethod: {
      type: String,
      enum: {
        values: ['card', 'cash', 'wallet'],
        message: 'Payment method must be card, cash, or wallet'
      },
      required: [true, 'Payment method is required']
    },
    razorpayOrderId: {
      type: String,
      trim: true
    },
    razorpayPaymentId: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed'],
        message: 'Transaction status must be pending, paid, or failed'
      },
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Create indexes
transactionSchema.index({ rideId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ driverId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ razorpayOrderId: 1 });
transactionSchema.index({ razorpayPaymentId: 1 });

// Create and export the Transaction model
const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);

export default Transaction;
