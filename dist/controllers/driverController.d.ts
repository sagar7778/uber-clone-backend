import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const getDriverProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateDriverProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const acceptRide: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDriverRides: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=driverController.d.ts.map