import mongoose, { Document, Schema } from 'mongoose';

/**
 * Driver approval status options
 */
export type DriverApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Driver profile document interface
 */
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

/**
 * Driver profile schema definition
 */
const driverProfileSchema = new Schema<IDriverProfile>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Driver ID is required'],
      unique: true
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'APPROVED', 'REJECTED'],
        message: 'Status must be PENDING, APPROVED, or REJECTED'
      },
      default: 'PENDING'
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    documentsVerified: {
      type: Boolean,
      default: false
    },
    backgroundCheckPassed: {
      type: Boolean,
      default: false
    },
    insuranceValid: {
      type: Boolean,
      default: false
    },
    vehicleInspectionPassed: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Create indexes
driverProfileSchema.index({ driverId: 1 });
driverProfileSchema.index({ status: 1 });
driverProfileSchema.index({ createdAt: -1 });

// Create and export the DriverProfile model
const DriverProfile = mongoose.model<IDriverProfile>('DriverProfile', driverProfileSchema);

export default DriverProfile;
