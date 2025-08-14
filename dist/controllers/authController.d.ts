import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        email: string;
    };
}
interface UserSignupBody {
    name: string;
    email: string;
    password: string;
    phone: string;
    role?: 'user' | 'admin' | 'driver';
}
interface DriverSignupBody {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'driver';
    licenseNumber: string;
    licenseImage?: string;
    vehicleType: 'sedan' | 'suv' | 'hatchback' | 'bike' | 'auto';
    vehicleModel: string;
    vehicleNumber: string;
    vehicleImage?: string;
    currentLat?: number;
    currentLng?: number;
}
interface LoginBody {
    email: string;
    password: string;
}
export declare const healthCheck: (req: Request, res: Response) => Promise<void>;
export declare const signup: (req: Request<{}, {}, UserSignupBody>, res: Response) => Promise<void>;
export declare const driverSignup: (req: Request<{}, {}, DriverSignupBody>, res: Response) => Promise<void>;
export declare const login: (req: Request<{}, {}, LoginBody>, res: Response) => Promise<void>;
export declare const logout: (req: AuthRequest, res: Response) => Promise<void>;
export declare const forgotPassword: (req: Request, res: Response) => Promise<void>;
export declare const resetPassword: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=authController.d.ts.map