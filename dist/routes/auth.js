"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/health', authController_1.healthCheck);
router.post('/signup', authController_1.signup);
router.post('/driver-signup', authController_1.driverSignup);
router.post('/login', authController_1.login);
router.post('/logout', auth_1.authenticate, authController_1.logout);
router.get('/me', auth_1.authenticate, (req, res) => {
    res.json({
        success: true,
        data: {
            user: {
                id: req.user?.id,
                role: req.user?.role,
                email: req.user?.email
            }
        }
    });
});
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/reset-password', authController_1.resetPassword);
exports.default = router;
//# sourceMappingURL=auth.js.map