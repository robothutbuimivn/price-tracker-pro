// API endpoint helper - uses environment variables or detects from hostname
export const getApiBaseUrl = (): string => {
  // Fallback: detect based on hostname
  if (typeof window === 'undefined') {
    return 'http://localhost:8080';
  }
  
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    return 'http://localhost:8080';
  }
  
  // For production, use /api prefix (proxy through Nginx)
  return '/api';
};

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Combine base URL with path
  return `${baseUrl}${path}`;
};
