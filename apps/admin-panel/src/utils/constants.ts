export const COUNTRIES = [
    { value: 'albania', label: 'Albania' },
    { value: 'bosnia-herzegovina', label: 'Bosnia and Herzegovina' },
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

export const ORGANISATION_TYPES = [
    { value: 'NGO', label: 'NGO' },
    { value: 'Association', label: 'Association' },
    { value: 'Foundation', label: 'Foundation' },
    { value: 'Cooperative', label: 'Cooperative' },
    { value: 'Social Enterprise', label: 'Social Enterprise' },
    { value: 'Public Institution', label: 'Public Institution' },
    { value: 'Private Company', label: 'Private Company' },
    { value: 'University', label: 'University' },
    { value: 'Research Institute', label: 'Research Institute' },
    { value: 'Other', label: 'Other' },
] as const;

export const ORGANISATION_STATUS = [
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'draft', label: 'Draft' },
    { value: 'declined', label: 'Declined' },
    { value: 'suspended', label: 'Suspended' },
] as const;

export const THEMATIC_AREAS = [
    { value: 'Education', label: 'Education' },
    { value: 'Health', label: 'Health' },
    { value: 'Environment', label: 'Environment' },
    { value: 'Human Rights', label: 'Human Rights' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Social Inclusion', label: 'Social Inclusion' },
    { value: 'Community Development', label: 'Community Development' },
    { value: 'Youth Development', label: 'Youth Development' },
    { value: 'Gender Equality', label: 'Gender Equality' },
    { value: 'Migration', label: 'Migration' },
    { value: 'Climate Action', label: 'Climate Action' },
    { value: 'Digital Transformation', label: 'Digital Transformation' },
    { value: 'Cultural Heritage', label: 'Cultural Heritage' },
    { value: 'Economic Development', label: 'Economic Development' },
    { value: 'Peace & Security', label: 'Peace & Security' },
] as const;

export const EXPERTISE_OFFERED = [
    { value: 'Project Management', label: 'Project Management' },
    { value: 'Training & Capacity Building', label: 'Training & Capacity Building' },
    { value: 'Policy Advocacy', label: 'Policy Advocacy' },
    { value: 'Community Engagement', label: 'Community Engagement' },
    { value: 'Educational Programs', label: 'Educational Programs' },
    { value: 'Research & Analysis', label: 'Research & Analysis' },
    { value: 'Social Entrepreneurship', label: 'Social Entrepreneurship' },
    { value: 'Technology Solutions', label: 'Technology Solutions' },
    { value: 'Fundraising', label: 'Fundraising' },
    { value: 'Communication & Marketing', label: 'Communication & Marketing' },
    { value: 'Monitoring & Evaluation', label: 'Monitoring & Evaluation' },
    { value: 'Legal Support', label: 'Legal Support' },
    { value: 'Financial Management', label: 'Financial Management' },
    { value: 'Volunteer Management', label: 'Volunteer Management' },
    { value: 'Partnership Development', label: 'Partnership Development' },
] as const;

export const EXPERTISE_SOUGHT = [
    { value: 'Project Management', label: 'Project Management' },
    { value: 'Training & Capacity Building', label: 'Training & Capacity Building' },
    { value: 'Policy Advocacy', label: 'Policy Advocacy' },
    { value: 'Community Engagement', label: 'Community Engagement' },
    { value: 'Educational Programs', label: 'Educational Programs' },
    { value: 'Research & Analysis', label: 'Research & Analysis' },
    { value: 'Social Entrepreneurship', label: 'Social Entrepreneurship' },
    { value: 'Technology Solutions', label: 'Technology Solutions' },
    { value: 'Fundraising', label: 'Fundraising' },
    { value: 'Communication & Marketing', label: 'Communication & Marketing' },
    { value: 'Monitoring & Evaluation', label: 'Monitoring & Evaluation' },
    { value: 'Legal Support', label: 'Legal Support' },
    { value: 'Financial Management', label: 'Financial Management' },
    { value: 'Volunteer Management', label: 'Volunteer Management' },
    { value: 'Partnership Development', label: 'Partnership Development' },
] as const;

export const PREFERRED_ROLES = [
    { value: 'Lead Partner', label: 'Lead Partner' },
    { value: 'Partner', label: 'Partner' },
    { value: 'Sub-contractor', label: 'Sub-contractor' },
    { value: 'Consultant', label: 'Consultant' },
    { value: 'Observer', label: 'Observer' },
    { value: 'Mentor', label: 'Mentor' },
    { value: 'Beneficiary', label: 'Beneficiary' },
] as const;

export const GEOGRAPHICAL_COVERAGE = [
    { value: 'Local', label: 'Local' },
    { value: 'Regional', label: 'Regional' },
    { value: 'National', label: 'National' },
    { value: 'International', label: 'International' },
    { value: 'EU-wide', label: 'EU-wide' },
    { value: 'Global', label: 'Global' },
] as const;

export const AVAILABLE_RESOURCES = [
    { value: 'Meeting Space', label: 'Meeting Space' },
    { value: 'Volunteers', label: 'Volunteers' },
    { value: 'Equipment', label: 'Equipment' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'Catering', label: 'Catering' },
    { value: 'Translation Services', label: 'Translation Services' },
    { value: 'Legal Support', label: 'Legal Support' },
    { value: 'Financial Resources', label: 'Financial Resources' },
    { value: 'Expertise', label: 'Expertise' },
    { value: 'Networks', label: 'Networks' },
    { value: 'Training Facilities', label: 'Training Facilities' },
] as const;

export const FUNDING_SOURCES = [
    { value: 'EU Funding', label: 'EU Funding' },
    { value: 'National Government', label: 'National Government' },
    { value: 'Local Government', label: 'Local Government' },
    { value: 'Private Donor', label: 'Private Donor' },
    { value: 'Corporate Sponsorship', label: 'Corporate Sponsorship' },
    { value: 'Foundation Grant', label: 'Foundation Grant' },
    { value: 'Crowdfunding', label: 'Crowdfunding' },
    { value: 'Internal', label: 'Internal' },
    { value: 'Mixed Funding', label: 'Mixed Funding' },
    { value: 'Other', label: 'Other' },
] as const;

export const BUDGET_VISIBILITY = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
    { value: 'members', label: 'Members Only' },
] as const;

export const PROJECT_VISIBILITY = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
    { value: 'members', label: 'Members Only' },
] as const;

export const PROJECT_STATUS = [
    { value: 'planned', label: 'Planned' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
] as const; 
