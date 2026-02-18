interface VerificationCode {
    code: string;
    createdAt: Date;
    expiresAt: Date;
    verified?: boolean;
    verifiedAt?: Date;
}

class VerificationStorage {
    private emailVerifications = new Map<string, VerificationCode>();
    private phoneVerifications = new Map<string, VerificationCode>();

    // Email verification methods
    async setEmailVerification(email: string, code: string): Promise<void> {
        const verification: VerificationCode = {
            code,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        };
        this.emailVerifications.set(email, verification);
    }

    async getEmailVerification(email: string): Promise<VerificationCode | null> {
        const verification = this.emailVerifications.get(email);
        if (!verification) return null;

        // Check if expired
        if (new Date() > verification.expiresAt) {
            this.emailVerifications.delete(email);
            return null;
        }

        return verification;
    }

    async deleteEmailVerification(email: string): Promise<void> {
        this.emailVerifications.delete(email);
    }

    async updateEmailVerification(email: string, updates: Partial<VerificationCode>): Promise<void> {
        const verification = this.emailVerifications.get(email);
        if (verification) {
            this.emailVerifications.set(email, { ...verification, ...updates });
        }
    }

    // Phone verification methods
    async setPhoneVerification(phone: string, code: string): Promise<void> {
        const verification: VerificationCode = {
            code,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        };
        this.phoneVerifications.set(phone, verification);
    }

    async getPhoneVerification(phone: string): Promise<VerificationCode | null> {
        const verification = this.phoneVerifications.get(phone);
        if (!verification) return null;

        // Check if expired
        if (new Date() > verification.expiresAt) {
            this.phoneVerifications.delete(phone);
            return null;
        }

        return verification;
    }

    async deletePhoneVerification(phone: string): Promise<void> {
        this.phoneVerifications.delete(phone);
    }

    async updatePhoneVerification(phone: string, updates: Partial<VerificationCode>): Promise<void> {
        const verification = this.phoneVerifications.get(phone);
        if (verification) {
            this.phoneVerifications.set(phone, { ...verification, ...updates });
        }
    }

    // Cleanup expired verifications
    cleanup(): void {
        const now = new Date();

        // Clean email verifications
        for (const [email, verification] of this.emailVerifications.entries()) {
            if (now > verification.expiresAt) {
                this.emailVerifications.delete(email);
            }
        }

        // Clean phone verifications
        for (const [phone, verification] of this.phoneVerifications.entries()) {
            if (now > verification.expiresAt) {
                this.phoneVerifications.delete(phone);
            }
        }
    }
}

// Export singleton instance
export const verificationStorage = new VerificationStorage();

// Run cleanup every 5 minutes
setInterval(() => {
    verificationStorage.cleanup();
}, 5 * 60 * 1000); 