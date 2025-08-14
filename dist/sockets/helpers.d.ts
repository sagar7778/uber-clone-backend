import { Server as SocketIOServer } from 'socket.io';
export declare const initializeSocketHelpers: (socketServer: SocketIOServer) => void;
export declare const emitToNearbyDrivers: (pickupLat: number, pickupLng: number, event: string, payload: any) => void;
export declare const emitToRideRoom: (rideId: string, event: string, payload: any) => void;
export declare const emitToUser: (userId: string, event: string, payload: any) => void;
export declare const emitToDriver: (driverId: string, event: string, payload: any) => void;
//# sourceMappingURL=helpers.d.ts.map