"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const middlewares_1 = require("../middlewares");
const router = (0, express_1.Router)();
router.use(middlewares_1.authenticate);
router.use((0, middlewares_1.requireRole)('admin'));
router.get('/', userController_1.getAllUsers);
router.get('/stats', userController_1.getUserStats);
router.get('/:id', userController_1.getUserById);
router.post('/', userController_1.createUser);
router.put('/:id', userController_1.updateUser);
router.delete('/:id', userController_1.deleteUser);
router.post('/:id/change-role', userController_1.changeUserRole);
router.post('/:id/reset-password', userController_1.resetUserPassword);
exports.default = router;
//# sourceMappingURL=users.js.map