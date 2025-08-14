import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
export declare const initializeSocketIO: (httpServer: HTTPServer) => SocketIOServer;
export declare const getUserSocketId: (userId: string) => string | undefined;
export declare const getDriverSocketId: (driverId: string) => string | undefined;
export declare const getConnectedUsersCount: () => number;
export declare const getConnectedDriversCount: () => number;
//# sourceMappingURL=index.d.ts.map