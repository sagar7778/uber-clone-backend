"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || (smtpUser || '');
const sendMail = async (to, subject, html) => {
    if (!smtpUser || !smtpPass) {
        throw new Error('SMTP_USER and SMTP_PASS are required');
    }
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass }
    });
    return transporter.sendMail({ from: mailFrom, to, subject, html });
};
exports.sendMail = sendMail;
//# sourceMappingURL=mailer.js.map