// Detect if we're running locally
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

// Or use environment variable
const USE_LOCAL = process.env.NEXT_PUBLIC_USE_LOCAL === 'true' || isLocalhost;

// API URL - automatically switches
export const API_URL = USE_LOCAL
  ? 'http://localhost:5000'
  : 'https://crypto-backend-production-11dc.up.railway.app';

// Base URL for API calls
export const BASE_URL = API_URL;