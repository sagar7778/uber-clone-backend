import mongoose, { Document } from 'mongoose';
export type UserRole = 'user' | 'driver' | 'admin';
export type PaymentMethod = 'card' | 'cash';
export interface ISavedLocation {
    label: string;
    address: string;
    lat: number;
    lng: number;
}
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;
    phone: string;
    profileImage?: string;
    role: UserRole;
    defaultPaymentMethod: PaymentMethod;
    savedLocations: ISavedLocation[];
    resetPasswordToken?: string | null;
    resetPasswordExpires?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default User;
//# sourceMappingURL=User.d.ts.map