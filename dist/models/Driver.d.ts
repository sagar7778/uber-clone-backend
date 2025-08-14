import mongoose, { Document } from 'mongoose';
export type VehicleType = 'sedan' | 'suv' | 'hatchback' | 'bike' | 'auto';
export interface ICurrentLocation {
    lat: number;
    lng: number;
    updatedAt: Date;
}
export interface IDriver extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    phone: string;
    licenseNumber: string;
    licenseImage: string;
    vehicleType: VehicleType;
    vehicleModel: string;
    vehicleNumber: string;
    vehicleImage: string;
    rating: number;
    isAvailable: boolean;
    currentLocation: ICurrentLocation;
    totalEarnings: number;
    completedRides: number;
    resetPasswordToken?: string | null;
    resetPasswordExpires?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const Driver: mongoose.Model<IDriver, {}, {}, {}, mongoose.Document<unknown, {}, IDriver, {}, {}> & IDriver & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Driver;
//# sourceMappingURL=Driver.d.ts.map