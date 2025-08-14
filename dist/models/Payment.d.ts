import mongoose, { Document } from 'mongoose';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
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
declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Payment;
//# sourceMappingURL=Payment.d.ts.map