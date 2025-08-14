"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.requireAdminOrDriver = exports.requireDriverOrUser = exports.requireUser = exports.requireDriver = exports.requireAdmin = exports.requireRole = void 0;
const requireRole = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            if (!roles.includes(req.user.role)) {
                res.status(403).json({
                    success: false,
                    message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error('Role authorization middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during authorization'
            });
        }
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)('admin');
exports.requireDriver = (0, exports.requireRole)('driver');
exports.requireUser = (0, exports.requireRole)('user');
exports.requireDriverOrUser = (0, exports.requireRole)('driver', 'user');
exports.requireAdminOrDriver = (0, exports.requireRole)('admin', 'driver');
const requireAuth = (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Authentication check middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication check'
        });
    }
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=roles.js.map