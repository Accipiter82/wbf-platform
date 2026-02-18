export declare const EMAIL_REGEX: RegExp;
export declare const PHONE_REGEX: RegExp;
export declare const WEBSITE_REGEX: RegExp;
export declare const validateEmail: (email: string) => boolean;
export declare const validatePhone: (phone: string) => boolean;
export declare const validateWebsite: (website: string) => boolean;
export declare const validateRequired: (value: any) => boolean;
export declare const validateMinLength: (value: string, minLength: number) => boolean;
export declare const validateMaxLength: (value: string, maxLength: number) => boolean;
export declare const validateArrayMinLength: (array: any[], minLength: number) => boolean;
export declare const validateOrganisationName: (name: string) => {
    isValid: boolean;
    error?: string;
};
export declare const validateOrganisationEmail: (email: string) => {
    isValid: boolean;
    error?: string;
};
export declare const validateOrganisationPhone: (phone: string) => {
    isValid: boolean;
    error?: string;
};
export declare const validateOrganisationDescription: (description: string) => {
    isValid: boolean;
    error?: string;
};
export declare const validateOrganisationSectors: (sectors: string[]) => {
    isValid: boolean;
    error?: string;
};
export declare const validateOrganisationCountry: (country: string) => {
    isValid: boolean;
    error?: string;
};
export declare const validateOrganisationWebsite: (website: string) => {
    isValid: boolean;
    error?: string;
};
//# sourceMappingURL=validation.d.ts.map