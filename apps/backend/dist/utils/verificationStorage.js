"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationStorage = void 0;
class VerificationStorage {
    emailVerifications = new Map();
    phoneVerifications = new Map();
    async setEmailVerification(email, code) {
        const verification = {
            code,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        };
        this.emailVerifications.set(email, verification);
    }
    async getEmailVerification(email) {
        const verification = this.emailVerifications.get(email);
        if (!verification)
            return null;
        if (new Date() > verification.expiresAt) {
            this.emailVerifications.delete(email);
            return null;
        }
        return verification;
    }
    async deleteEmailVerification(email) {
        this.emailVerifications.delete(email);
    }
    async updateEmailVerification(email, updates) {
        const verification = this.emailVerifications.get(email);
        if (verification) {
            this.emailVerifications.set(email, { ...verification, ...updates });
        }
    }
    async setPhoneVerification(phone, code) {
        const verification = {
            code,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        };
        this.phoneVerifications.set(phone, verification);
    }
    async getPhoneVerification(phone) {
        const verification = this.phoneVerifications.get(phone);
        if (!verification)
            return null;
        if (new Date() > verification.expiresAt) {
            this.phoneVerifications.delete(phone);
            return null;
        }
        return verification;
    }
    async deletePhoneVerification(phone) {
        this.phoneVerifications.delete(phone);
    }
    async updatePhoneVerification(phone, updates) {
        const verification = this.phoneVerifications.get(phone);
        if (verification) {
            this.phoneVerifications.set(phone, { ...verification, ...updates });
        }
    }
    cleanup() {
        const now = new Date();
        for (const [email, verification] of this.emailVerifications.entries()) {
            if (now > verification.expiresAt) {
                this.emailVerifications.delete(email);
            }
        }
        for (const [phone, verification] of this.phoneVerifications.entries()) {
            if (now > verification.expiresAt) {
                this.phoneVerifications.delete(phone);
            }
        }
    }
}
exports.verificationStorage = new VerificationStorage();
setInterval(() => {
    exports.verificationStorage.cleanup();
}, 5 * 60 * 1000);
//# sourceMappingURL=verificationStorage.js.map