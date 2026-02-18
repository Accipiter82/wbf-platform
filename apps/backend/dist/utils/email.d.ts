import 'dotenv/config';
import { Organisation } from "../types";
export declare const sendApprovalEmail: (organisation: Organisation) => Promise<void>;
export declare const sendDeclineEmail: (organisation: Organisation, feedback: string) => Promise<void>;
export declare const sendVerificationEmail: (email: string, verificationCode: string) => Promise<void>;
export declare const sendDirectMessageEmail: (recipientEmail: string, recipientName: string, senderName: string, messagePreview: string) => Promise<void>;
export declare const sendApplicationEmail: (recipientEmail: string, recipientName: string, applicantName: string, opportunityTitle: string, opportunityType: "call" | "project") => Promise<void>;
//# sourceMappingURL=email.d.ts.map