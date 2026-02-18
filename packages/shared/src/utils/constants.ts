export const COUNTRIES = [
    { value: 'albania', label: 'Albania' },
    { value: 'bosnia-herzegovina', label: 'Bosnia and Herzegovina' },
    { value: 'croatia', label: 'Croatia' },
    { value: 'kosovo', label: 'Kosovo' },
    { value: 'montenegro', label: 'Montenegro' },
    { value: 'north-macedonia', label: 'North Macedonia' },
    { value: 'serbia', label: 'Serbia' },
] as const;

export const SECTORS = [
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'environment', label: 'Environment' },
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'tourism', label: 'Tourism' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'energy', label: 'Energy' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'media', label: 'Media & Communications' },
    { value: 'non-profit', label: 'Non-Profit' },
    { value: 'government', label: 'Government' },
    { value: 'research', label: 'Research & Development' },
    { value: 'other', label: 'Other' },
] as const;

export const ORGANISATION_STATUSES = {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    DECLINED: 'declined',
} as const;

export const USER_ROLES = {
    ORGANISATION: 'organisation',
    ADMIN: 'admin',
} as const;

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER_STEP1: '/auth/register/step-1',
        REGISTER_STEP2: '/auth/register/step-2',
        ME: '/auth/me',
    },
    ORGANISATION: {
        BROWSE: '/organisation/browse',
        GET: '/organisation/:id',
        ME_PROFILE: '/organisation/me/profile',
        EDIT: '/organisation/:id/edit',
    },
    ADMIN: {
        PENDING: '/admin/pending',
        ORGANISATIONS: '/admin/organisations',
        REVIEW: '/admin/review/:id',
        STATS: '/admin/stats',
    },
} as const;

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
} as const; 