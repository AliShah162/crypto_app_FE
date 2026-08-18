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
  : process.env.REACT_APP_API_URL || 'https://crypto-backend-lovat.vercel.app';

// Base URL for API calls
export const BASE_URL = API_URL;

// Check if we're in production
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ================= CORS TESTING =================

/**
 * Test if the API is reachable and CORS is configured correctly
 */
export async function checkAPIAvailability() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_URL}/api/test`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log(`✅ API test response: ${response.status}`);
    console.log(`✅ CORS header: ${response.headers.get('access-control-allow-origin')}`);
    
    return response.ok;
  } catch (error) {
    console.error('❌ API availability check failed:', error);
    return false;
  }
}

/**
 * Test CORS specifically by checking if the API responds to cross-origin requests
 */
export async function testCORS() {
  try {
    const response = await fetch(`${API_URL}/ping`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log(`✅ CORS test - Status: ${response.status}`);
    console.log(`✅ CORS test - Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`);
    
    return response.ok;
  } catch (err) {
    console.error('❌ CORS test failed:', err);
    return false;
  }
}

/**
 * Check if the admin login endpoint is accessible
 */
export async function checkAdminLoginAvailability() {
  try {
    const response = await fetch(`${API_URL}/api/users/admin/login`, {
      method: 'OPTIONS',
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log(`✅ Admin login endpoint test - Status: ${response.status}`);
    console.log(`✅ Admin CORS header: ${response.headers.get('access-control-allow-origin')}`);
    
    return response.ok || response.status === 204 || response.status === 200;
  } catch (err) {
    console.error('❌ Admin login endpoint test failed:', err);
    return false;
  }
}

// ================= LOGGING =================

// Log the API URL being used (helps debug Indian users)
if (typeof window !== 'undefined') {
  console.log(`🔗 API URL: ${API_URL}`);
  console.log(`🌍 Environment: ${IS_PRODUCTION ? 'Production' : 'Development'}`);
  console.log(`🖥️ USE_LOCAL: ${USE_LOCAL}`);
  console.log(`📦 REACT_APP_API_URL: ${process.env.REACT_APP_API_URL || 'Not set'}`);
  
  // ✅ Auto-test CORS on load (for debugging)
  setTimeout(() => {
    checkAPIAvailability().then(available => {
      if (available) {
        console.log('✅ API is reachable!');
      } else {
        console.warn('⚠️ API is NOT reachable. Check CORS and network.');
      }
    });
  }, 2000);
}

// ================= HELPER FUNCTIONS =================

/**
 * Wrapper for fetch with timeout and error handling
 */
export async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    
    if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw error;
  }
}

/**
 * Check if the API is configured correctly
 */
export function isAPIConfigured() {
  return API_URL && API_URL !== 'undefined' && API_URL !== '' && API_URL !== 'null';
}

/**
 * Get the full API URL for a path
 */
export function getFullUrl(path) {
  if (!path) return API_URL;
  return `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
}

export default {
  API_URL,
  BASE_URL,
  IS_PRODUCTION,
  checkAPIAvailability,
  testCORS,
  checkAdminLoginAvailability,
  fetchWithTimeout,
  isAPIConfigured,
  getFullUrl,
};