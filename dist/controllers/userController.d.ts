import { Request, Response } from 'express';
interface CreateUserBody {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'user' | 'driver' | 'admin';
    profileImage?: string;
    defaultPaymentMethod?: 'card' | 'cash';
    savedLocations?: Array<{
        label: string;
        address: string;
        lat: number;
        lng: number;
    }>;
}
interface UpdateUserBody {
    name?: string;
    email?: string;
    phone?: string;
    profileImage?: string;
    defaultPaymentMethod?: 'card' | 'cash';
    savedLocations?: Array<{
        label: string;
        address: string;
        lat: number;
        lng: number;
    }>;
}
export declare const getAllUsers: (req: Request, res: Response) => Promise<void>;
export declare const getUserById: (req: Request, res: Response) => Promise<void>;
export declare const createUser: (req: Request<{}, {}, CreateUserBody>, res: Response) => Promise<void>;
export declare const updateUser: (req: Request<{
    id: string;
}, {}, UpdateUserBody>, res: Response) => Promise<void>;
export declare const deleteUser: (req: Request, res: Response) => Promise<void>;
export declare const changeUserRole: (req: Request, res: Response) => Promise<void>;
export declare const resetUserPassword: (req: Request, res: Response) => Promise<void>;
export declare const getUserStats: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=userController.d.ts.map