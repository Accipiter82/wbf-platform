// import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
// import { storage } from '../firebase';

export interface UploadResult {
    url: string;
    path: string;
    success: boolean;
    error?: string;
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Upload organisation logo via backend proxy
 */
export const uploadOrganisationLogo = async (file: File, _organisationId: string): Promise<UploadResult> => {
    try {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
            return {
                url: '',
                path: '',
                success: false,
                error: validation.error
            };
        }

        // Create FormData
        const formData = new FormData();
        formData.append('logo', file);

        // Upload via backend proxy
        const response = await fetch(`${API_BASE_URL}/organisation/upload-logo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                url: '',
                path: '',
                success: false,
                error: result.error || 'Upload failed'
            };
        }

        return {
            url: result.data.url,
            path: result.data.path,
            success: true
        };
    } catch (error) {
        console.error('Logo upload error:', error);
        return {
            url: '',
            path: '',
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
};

/**
 * Upload organisation cover photo via backend proxy
 */
export const uploadOrganisationCover = async (file: File, _organisationId: string): Promise<UploadResult> => {
    try {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
            return {
                url: '',
                path: '',
                success: false,
                error: validation.error
            };
        }

        // Create FormData
        const formData = new FormData();
        formData.append('cover', file);

        // Upload via backend proxy
        const response = await fetch(`${API_BASE_URL}/organisation/upload-cover`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                url: '',
                path: '',
                success: false,
                error: result.error || 'Upload failed'
            };
        }

        return {
            url: result.data.url,
            path: result.data.path,
            success: true
        };
    } catch (error) {
        console.error('Cover upload error:', error);
        return {
            url: '',
            path: '',
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
};

/**
 * Delete a file from Firebase Storage
 * @deprecated Storage service is currently unavailable
 */
// @ts-ignore
export const deleteFileFromStorage = async (filePath: string): Promise<boolean> => {
    console.error('deleteFileFromStorage is deprecated and disabled');
    return false;
};

/**
 * Delete organisation cover photo via backend proxy
 */
export const deleteOrganisationCover = async (path: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/organisation/delete-cover`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ path }),
        });
        const result = await response.json();
        if (!response.ok) {
            return { success: false, error: result.error || 'Delete failed' };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
};

/**
 * Delete organisation logo via backend proxy
 */
export const deleteOrganisationLogo = async (path: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/organisation/delete-logo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ path }),
        });
        const result = await response.json();
        if (!response.ok) {
            return { success: false, error: result.error || 'Delete failed' };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Upload project image to Firebase Storage
 */
export const uploadProjectImage = async (file: File, organisationId: string, projectIndex: number): Promise<UploadResult> => {
    try {
        // Validate file
        const validation = validateImageFile(file);

        if (!validation.valid) {
            return {
                url: '',
                path: '',
                success: false,
                error: validation.error
            };
        }

        // Create FormData
        const formData = new FormData();
        formData.append('image', file);
        formData.append('organisationId', organisationId);
        formData.append('projectIndex', projectIndex.toString());

        // Upload via backend proxy
        const response = await fetch(`${API_BASE_URL}/organisation/upload-project-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                url: '',
                path: '',
                success: false,
                error: result.error || 'Upload failed'
            };
        }

        return {
            url: result.data.url,
            path: result.data.path,
            success: true
        };
    } catch (error) {
        console.error('Project image upload error:', error);
        return {
            url: '',
            path: '',
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
};

/**
 * Delete project image from Firebase Storage
 */
export const deleteProjectImage = async (path: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/organisation/delete-project-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ path }),
        });
        const result = await response.json();
        if (!response.ok) {
            return { success: false, error: result.error || 'Delete failed' };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
};

/**
 * Upload success story image to Firebase Storage
 */
export const uploadSuccessStoryImage = async (file: File, organisationId: string, storyIndex: number): Promise<UploadResult> => {
    try {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
            return {
                url: '',
                path: '',
                success: false,
                error: validation.error
            };
        }

        // Create FormData
        const formData = new FormData();
        formData.append('image', file);
        formData.append('organisationId', organisationId);
        formData.append('storyIndex', storyIndex.toString());

        // Upload via backend proxy
        const response = await fetch(`${API_BASE_URL}/organisation/upload-success-story-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                url: '',
                path: '',
                success: false,
                error: result.error || 'Upload failed'
            };
        }

        return {
            url: result.data.url,
            path: result.data.path,
            success: true
        };
    } catch (error) {
        console.error('Success story image upload error:', error);
        return {
            url: '',
            path: '',
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
};

/**
 * Delete success story image from Firebase Storage
 */
export const deleteSuccessStoryImage = async (path: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/organisation/delete-success-story-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ path }),
        });
        const result = await response.json();
        if (!response.ok) {
            return { success: false, error: result.error || 'Delete failed' };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Please select a valid image file (JPEG, PNG, or WebP)`
        };
    }

    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            error: `File size must be less than ${maxSizeMB}MB`
        };
    }

    return { valid: true };
}; 