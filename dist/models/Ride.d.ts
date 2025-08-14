import mongoose, { Document } from 'mongoose';
export type RideStatus = 'requested' | 'accepted' | 'on_the_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export interface ILocation {
    address: string;
    lat: number;
    lng: number;
}
export interface IRide extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    driverId: mongoose.Types.ObjectId;
    pickupLocation: ILocation;
    dropLocation: ILocation;
    distanceKm: number;
    estimatedFare: number;
    actualFare?: number;
    paymentStatus: PaymentStatus;
    status: RideStatus;
    requestedAt: Date;
    acceptedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    ratingByUser?: number;
    ratingByDriver?: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const Ride: mongoose.Model<IRide, {}, {}, {}, mongoose.Document<unknown, {}, IRide, {}, {}> & IRide & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Ride;
//# sourceMappingURL=Ride.d.ts.map