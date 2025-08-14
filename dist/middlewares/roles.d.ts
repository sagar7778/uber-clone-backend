import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export declare const requireRole: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireDriver: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireUser: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireDriverOrUser: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAdminOrDriver: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAuth: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=roles.d.ts.map