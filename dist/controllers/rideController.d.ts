import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const estimateFare: (req: Request, res: Response) => Promise<void>;
export declare const requestRide: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getRide: (req: Request, res: Response) => Promise<void>;
export declare const cancelRide: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateRideStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const arriveRide: (req: AuthRequest, res: Response) => Promise<void>;
export declare const startRideController: (req: AuthRequest, res: Response) => Promise<void>;
export declare const completeRideController: (req: AuthRequest, res: Response) => Promise<void>;
export declare const rateRide: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=rideController.d.ts.map