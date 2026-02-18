"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendApplicationEmail = exports.sendDirectMessageEmail = exports.sendVerificationEmail = exports.sendDeclineEmail = exports.sendApprovalEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
require("dotenv/config");
console.log('[DEBUG] SMTP_HOST:', process.env.SMTP_HOST);
console.log('[DEBUG] SMTP_USER:', process.env.SMTP_USER);
console.log('[DEBUG] SMTP_PASS:', process.env.SMTP_PASS ? '***' : undefined);
const isSmtpConfigured = () => {
    return process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
};
const createTransporter = () => {
    if (!isSmtpConfigured()) {
        return {
            sendMail: async (options) => {
                console.log("📧 MOCK EMAIL SENT:");
                console.log(`   To: ${options.to}`);
                console.log(`   Subject: ${options.subject}`);
                console.log(`   Content: ${options.html}`);
                return { messageId: "mock-message-id" };
            }
        };
    }
    return nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};
const sendApprovalEmail = async (organisation) => {
    const transporter = createTransporter();
    const mailOptions = {
        from: process.env.SMTP_USER || "noreply@wbf-platform.com",
        to: organisation.contactEmail,
        subject: "Your Organisation Profile Has Been Approved!",
        html: `
      <h2>Congratulations!</h2>
      <p>Dear ${organisation.name},</p>
      <p>Your organisation profile has been approved by our admin team. You can now:</p>
      <ul>
        <li>Log in to your dashboard</li>
        <li>Browse other organisations</li>
        <li>Send messages and form partnerships</li>
        <li>Update your profile information</li>
      </ul>
      <p>Welcome to the WBF Organisation Platform!</p>
      <p>Best regards,<br>WBF Team</p>
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Approval email sent to ${organisation.contactEmail}`);
    }
    catch (error) {
        console.error("Error sending approval email:", error);
        throw error;
    }
};
exports.sendApprovalEmail = sendApprovalEmail;
const sendDeclineEmail = async (organisation, feedback) => {
    const transporter = createTransporter();
    const mailOptions = {
        from: process.env.SMTP_USER || "noreply@wbf-platform.com",
        to: organisation.contactEmail,
        subject: "Organisation Profile Review - Action Required",
        html: `
      <h2>Profile Review Update</h2>
      <p>Dear ${organisation.name},</p>
      <p>After reviewing your organisation profile, we have some feedback that needs to be addressed before approval:</p>
      <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #ff6b6b;">
        <strong>Feedback:</strong><br>
        ${feedback}
      </div>
      <p>Please log in to your dashboard to view the detailed feedback and resubmit your profile with the necessary changes.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>WBF Team</p>
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Decline email sent to ${organisation.contactEmail}`);
    }
    catch (error) {
        console.error("Error sending decline email:", error);
        throw error;
    }
};
exports.sendDeclineEmail = sendDeclineEmail;
const sendVerificationEmail = async (email, verificationCode) => {
    const transporter = createTransporter();
    const mailOptions = {
        from: process.env.SMTP_USER || "noreply@wbf-platform.com",
        to: email,
        subject: "Email Verification - WBF Organisation Platform",
        html: `
      <h2>Email Verification</h2>
      <p>Thank you for registering with the WBF Organisation Platform!</p>
      <p>Your verification code is: <strong>${verificationCode}</strong></p>
      <p>Please enter this code to verify your email address and continue with your registration.</p>
      <p>If you didn't request this verification, please ignore this email.</p>
      <p>Best regards,<br>WBF Team</p>
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
        if (!isSmtpConfigured()) {
            console.log(`🔐 EMAIL VERIFICATION CODE for ${email}: ${verificationCode}`);
        }
    }
    catch (error) {
        console.error("Error sending verification email:", error);
        throw error;
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendDirectMessageEmail = async (recipientEmail, recipientName, senderName, messagePreview) => {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const messagesUrl = `${frontendUrl}/messages`;
    const mailOptions = {
        from: process.env.SMTP_USER || "noreply@wbf-platform.com",
        to: recipientEmail,
        subject: `New Message from ${senderName} - WBF Platform`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #228be6;">You Have a New Message</h2>
        <p>Dear ${recipientName},</p>
        <p>You have new email from <strong>${senderName}</strong>. You can check the message <a href="${messagesUrl}" style="color: #228be6; text-decoration: underline;">here</a>.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #228be6; border-radius: 4px;">
          <strong>Message Preview:</strong><br>
          <p style="margin: 10px 0 0 0; color: #555;">${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? "..." : ""}</p>
        </div>
        <p style="margin-top: 20px;">
          <a href="${messagesUrl}" style="background-color: #228be6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Check Message</a>
        </p>
        <p style="margin-top: 30px; color: #888; font-size: 12px;">Best regards,<br>WBF Team</p>
      </div>
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Direct message notification sent to ${recipientEmail}`);
    }
    catch (error) {
        console.error("Error sending direct message email:", error);
    }
};
exports.sendDirectMessageEmail = sendDirectMessageEmail;
const sendApplicationEmail = async (recipientEmail, recipientName, applicantName, opportunityTitle, opportunityType) => {
    const transporter = createTransporter();
    const mailOptions = {
        from: process.env.SMTP_USER || "noreply@wbf-platform.com",
        to: recipientEmail,
        subject: `New Application for ${opportunityTitle} - WBF Platform`,
        html: `
      <h2>New Application Received</h2>
      <p>Dear ${recipientName},</p>
      <p>You have received a new application for your ${opportunityType}:</p>
      <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #40c057;">
        <strong>${opportunityTitle}</strong>
      </div>
      <p><strong>${applicantName}</strong> has submitted an application.</p>
      <p>Please login to the platform to review the application and respond:</p>
      <p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/messages?filter=applications" style="background-color: #40c057; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Application</a></p>
      <p>Best regards,<br>WBF Team</p>
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Application notification sent to ${recipientEmail}`);
    }
    catch (error) {
        console.error("Error sending application email:", error);
    }
};
exports.sendApplicationEmail = sendApplicationEmail;
//# sourceMappingURL=email.js.map