import { Request, Response, NextFunction } from "express";
import { AuthUser } from "../types";
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireSuperAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireOrganisation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuthenticateToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireOrganisationForProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map