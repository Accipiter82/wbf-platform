"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOrganisationWebsite = exports.validateOrganisationCountry = exports.validateOrganisationSectors = exports.validateOrganisationDescription = exports.validateOrganisationPhone = exports.validateOrganisationEmail = exports.validateOrganisationName = exports.validateArrayMinLength = exports.validateMaxLength = exports.validateMinLength = exports.validateRequired = exports.validateWebsite = exports.validatePhone = exports.validateEmail = exports.WEBSITE_REGEX = exports.PHONE_REGEX = exports.EMAIL_REGEX = void 0;
exports.EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
exports.PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;
exports.WEBSITE_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
const validateEmail = (email) => {
    return exports.EMAIL_REGEX.test(email);
};
exports.validateEmail = validateEmail;
const validatePhone = (phone) => {
    return exports.PHONE_REGEX.test(phone.replace(/\s/g, ''));
};
exports.validatePhone = validatePhone;
const validateWebsite = (website) => {
    if (!website)
        return true;
    return exports.WEBSITE_REGEX.test(website);
};
exports.validateWebsite = validateWebsite;
const validateRequired = (value) => {
    return value !== null && value !== undefined && value !== '';
};
exports.validateRequired = validateRequired;
const validateMinLength = (value, minLength) => {
    return value.length >= minLength;
};
exports.validateMinLength = validateMinLength;
const validateMaxLength = (value, maxLength) => {
    return value.length <= maxLength;
};
exports.validateMaxLength = validateMaxLength;
const validateArrayMinLength = (array, minLength) => {
    return array.length >= minLength;
};
exports.validateArrayMinLength = validateArrayMinLength;
const validateOrganisationName = (name) => {
    if (!(0, exports.validateRequired)(name)) {
        return { isValid: false, error: 'Organisation name is required' };
    }
    if (!(0, exports.validateMinLength)(name, 2)) {
        return { isValid: false, error: 'Organisation name must be at least 2 characters' };
    }
    if (!(0, exports.validateMaxLength)(name, 100)) {
        return { isValid: false, error: 'Organisation name must be less than 100 characters' };
    }
    return { isValid: true };
};
exports.validateOrganisationName = validateOrganisationName;
const validateOrganisationEmail = (email) => {
    if (!(0, exports.validateRequired)(email)) {
        return { isValid: false, error: 'Email is required' };
    }
    if (!(0, exports.validateEmail)(email)) {
        return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
};
exports.validateOrganisationEmail = validateOrganisationEmail;
const validateOrganisationPhone = (phone) => {
    if (!(0, exports.validateRequired)(phone)) {
        return { isValid: false, error: 'Phone number is required' };
    }
    if (!(0, exports.validatePhone)(phone)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
    }
    return { isValid: true };
};
exports.validateOrganisationPhone = validateOrganisationPhone;
const validateOrganisationDescription = (description) => {
    if (!(0, exports.validateRequired)(description)) {
        return { isValid: false, error: 'Description is required' };
    }
    if (!(0, exports.validateMinLength)(description, 10)) {
        return { isValid: false, error: 'Description must be at least 10 characters' };
    }
    if (!(0, exports.validateMaxLength)(description, 1000)) {
        return { isValid: false, error: 'Description must be less than 1000 characters' };
    }
    return { isValid: true };
};
exports.validateOrganisationDescription = validateOrganisationDescription;
const validateOrganisationSectors = (sectors) => {
    if (!(0, exports.validateArrayMinLength)(sectors, 1)) {
        return { isValid: false, error: 'At least one sector must be selected' };
    }
    return { isValid: true };
};
exports.validateOrganisationSectors = validateOrganisationSectors;
const validateOrganisationCountry = (country) => {
    if (!(0, exports.validateRequired)(country)) {
        return { isValid: false, error: 'Country is required' };
    }
    return { isValid: true };
};
exports.validateOrganisationCountry = validateOrganisationCountry;
const validateOrganisationWebsite = (website) => {
    if (website && !(0, exports.validateWebsite)(website)) {
        return { isValid: false, error: 'Please enter a valid website URL' };
    }
    return { isValid: true };
};
exports.validateOrganisationWebsite = validateOrganisationWebsite;
//# sourceMappingURL=validation.js.map