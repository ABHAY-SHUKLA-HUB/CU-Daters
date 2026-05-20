// File Upload Service for Support System
export const uploadSupportFiles = async (files, token) => {
  if (!files || files.length === 0) {
    return [];
  }

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const uploadedFiles = [];

  for (const file of files) {
    try {
      // Validate file
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        console.warn(`File ${file.name} exceeds 5MB limit`);
        continue;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        console.warn(`File type ${file.type} not allowed`);
        continue;
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'support');

      // Upload file
      const response = await fetch(`${API_BASE_URL}/api/support/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        uploadedFiles.push({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          url: data.data?.url || data.data?.filename
        });
      }
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
    }
  }

  return uploadedFiles;
};

// Download support attachment
export const downloadSupportAttachment = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Create temporary URL for download
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error downloading attachment:', error);
  }
};

// Validate file before upload
export const validateSupportFile = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not supported: ${file.type}`
    };
  }

  return { valid: true };
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default {
  uploadSupportFiles,
  downloadSupportAttachment,
  validateSupportFile,
  formatFileSize
};
