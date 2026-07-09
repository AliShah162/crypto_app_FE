// lib/config.js - API Configuration

// Detect if we're running locally
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

// Check for environment variable
const USE_LOCAL = process.env.NEXT_PUBLIC_USE_LOCAL === 'true' || isLocalhost;

// API URL - automatically switches
export const API_URL = USE_LOCAL
  ? 'http://localhost:5000'
  : 'https://crypto-backend-production-11dc.up.railway.app';

// Base URL for API calls
export const BASE_URL = API_URL;

// ================= ADD THESE FOR DEBUGGING =================

// Check if we're in production
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Log the API URL being used (helps debug Indian users)
if (typeof window !== 'undefined') {
  console.log(`🔗 API URL: ${API_URL}`);
  console.log(`🌍 Environment: ${IS_PRODUCTION ? 'Production' : 'Development'}`);
}

// Helper to check if the API is reachable
export async function checkAPIAvailability() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_URL}/api/test`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('API availability check failed:', error);
    return false;
  }
}