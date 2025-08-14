"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("./db/mongoose");
const app_1 = require("./app");
const sockets_1 = require("./sockets");
async function bootstrap() {
    try {
        console.log('🚀 Starting Uber Clone Backend...');
        await (0, mongoose_1.connectDB)();
        console.log('✅ Database connection established successfully');
        const io = (0, sockets_1.initializeSocketIO)(app_1.httpServer);
        const PORT = process.env.PORT_BACKEND || 4000;
        app_1.httpServer.listen(PORT, () => {
            console.log(`🚀 Express server running on port ${PORT}`);
            console.log(`📝 API available at http://localhost:${PORT}`);
            console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
            console.log(`🚗 Ride endpoints: http://localhost:${PORT}/api/rides`);
            console.log(`👨‍💼 Driver endpoints: http://localhost:${PORT}/api/driver`);
            console.log(`🔌 Socket.IO initialized and ready`);
            console.log(`💚 Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error('❌ Bootstrap failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    bootstrap();
}
exports.default = bootstrap;
//# sourceMappingURL=index.js.map