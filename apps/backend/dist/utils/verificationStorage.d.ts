interface VerificationCode {
    code: string;
    createdAt: Date;
    expiresAt: Date;
    verified?: boolean;
    verifiedAt?: Date;
}
declare class VerificationStorage {
    private emailVerifications;
    private phoneVerifications;
    setEmailVerification(email: string, code: string): Promise<void>;
    getEmailVerification(email: string): Promise<VerificationCode | null>;
    deleteEmailVerification(email: string): Promise<void>;
    updateEmailVerification(email: string, updates: Partial<VerificationCode>): Promise<void>;
    setPhoneVerification(phone: string, code: string): Promise<void>;
    getPhoneVerification(phone: string): Promise<VerificationCode | null>;
    deletePhoneVerification(phone: string): Promise<void>;
    updatePhoneVerification(phone: string, updates: Partial<VerificationCode>): Promise<void>;
    cleanup(): void;
}
export declare const verificationStorage: VerificationStorage;
export {};
//# sourceMappingURL=verificationStorage.d.ts.map