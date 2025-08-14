import mongoose, { Document } from 'mongoose';
export type DriverApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface IDriverProfile extends Document {
    _id: mongoose.Types.ObjectId;
    driverId: mongoose.Types.ObjectId;
    status: DriverApprovalStatus;
    rejectionReason?: string;
    documentsVerified: boolean;
    backgroundCheckPassed: boolean;
    insuranceValid: boolean;
    vehicleInspectionPassed: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    rejectedBy?: mongoose.Types.ObjectId;
    rejectedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const DriverProfile: mongoose.Model<IDriverProfile, {}, {}, {}, mongoose.Document<unknown, {}, IDriverProfile, {}, {}> & IDriverProfile & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default DriverProfile;
//# sourceMappingURL=DriverProfile.d.ts.map