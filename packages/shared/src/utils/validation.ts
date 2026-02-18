export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;
export const WEBSITE_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

export const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email);
};

export const validatePhone = (phone: string): boolean => {
    return PHONE_REGEX.test(phone.replace(/\s/g, ''));
};

export const validateWebsite = (website: string): boolean => {
    if (!website) return true; // Optional field
    return WEBSITE_REGEX.test(website);
};

export const validateRequired = (value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
};

export const validateMinLength = (value: string, minLength: number): boolean => {
    return value.length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
    return value.length <= maxLength;
};

export const validateArrayMinLength = (array: any[], minLength: number): boolean => {
    return array.length >= minLength;
};

export const validateOrganisationName = (name: string): { isValid: boolean; error?: string } => {
    if (!validateRequired(name)) {
        return { isValid: false, error: 'Organisation name is required' };
    }
    if (!validateMinLength(name, 2)) {
        return { isValid: false, error: 'Organisation name must be at least 2 characters' };
    }
    if (!validateMaxLength(name, 100)) {
        return { isValid: false, error: 'Organisation name must be less than 100 characters' };
    }
    return { isValid: true };
};

export const validateOrganisationEmail = (email: string): { isValid: boolean; error?: string } => {
    if (!validateRequired(email)) {
        return { isValid: false, error: 'Email is required' };
    }
    if (!validateEmail(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
};

export const validateOrganisationPhone = (phone: string): { isValid: boolean; error?: string } => {
    if (!validateRequired(phone)) {
        return { isValid: false, error: 'Phone number is required' };
    }
    if (!validatePhone(phone)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
    }
    return { isValid: true };
};

export const validateOrganisationDescription = (description: string): { isValid: boolean; error?: string } => {
    if (!validateRequired(description)) {
        return { isValid: false, error: 'Description is required' };
    }
    if (!validateMinLength(description, 10)) {
        return { isValid: false, error: 'Description must be at least 10 characters' };
    }
    if (!validateMaxLength(description, 1000)) {
        return { isValid: false, error: 'Description must be less than 1000 characters' };
    }
    return { isValid: true };
};

export const validateOrganisationSectors = (sectors: string[]): { isValid: boolean; error?: string } => {
    if (!validateArrayMinLength(sectors, 1)) {
        return { isValid: false, error: 'At least one sector must be selected' };
    }
    return { isValid: true };
};

export const validateOrganisationCountry = (country: string): { isValid: boolean; error?: string } => {
    if (!validateRequired(country)) {
        return { isValid: false, error: 'Country is required' };
    }
    return { isValid: true };
};

export const validateOrganisationWebsite = (website: string): { isValid: boolean; error?: string } => {
    if (website && !validateWebsite(website)) {
        return { isValid: false, error: 'Please enter a valid website URL' };
    }
    return { isValid: true };
}; 