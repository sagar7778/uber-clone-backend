// Export all models
export { default as User, type IUser, type UserRole, type PaymentMethod, type ISavedLocation } from './User';
export { default as Driver, type IDriver, type VehicleType, type ICurrentLocation } from './Driver';
export { default as Ride, type IRide, type RideStatus, type PaymentStatus, type ILocation } from './Ride';
export { default as Transaction, type ITransaction, type TransactionStatus } from './Transaction';
export { default as Payment, type IPayment } from './Payment';
export { default as DriverProfile, type IDriverProfile, type DriverApprovalStatus } from './DriverProfile';

// Re-export common types
export type { Document } from 'mongoose';
export type { ObjectId } from 'mongoose';
