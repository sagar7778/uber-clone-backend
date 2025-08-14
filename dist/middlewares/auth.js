"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        if (!token && req.cookies && req.cookies.auth_token) {
            token = req.cookies.auth_token;
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
            return;
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
                return;
            }
            req.user = {
                id: decoded.id,
                role: decoded.role,
                email: decoded.email
            };
            next();
        }
        catch (jwtError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during authentication'
        });
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        if (!token && req.cookies && req.cookies.auth_token) {
            token = req.cookies.auth_token;
        }
        if (!token) {
            next();
            return;
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            next();
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                next();
                return;
            }
            req.user = {
                id: decoded.id,
                role: decoded.role,
                email: decoded.email
            };
            next();
        }
        catch (jwtError) {
            next();
        }
    }
    catch (error) {
        console.error('Optional authentication middleware error:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map