import mongoose, { Document } from 'mongoose';
export type PaymentMethod = 'card' | 'cash' | 'wallet';
export type TransactionStatus = 'pending' | 'paid' | 'failed';
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
declare const Transaction: mongoose.Model<ITransaction, {}, {}, {}, mongoose.Document<unknown, {}, ITransaction, {}, {}> & ITransaction & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Transaction;
//# sourceMappingURL=Transaction.d.ts.map