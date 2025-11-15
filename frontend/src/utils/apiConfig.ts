// API endpoint helper - uses relative paths for production, localhost for development
export const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080';
  }
  
  // In production/staging, use relative paths or full domain
  // In development, use localhost:8080
  const isDevelopment = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    return 'http://localhost:8080';
  }
  
  // For production, use relative paths (proxy through same domain)
  return window.location.origin;
};

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};
