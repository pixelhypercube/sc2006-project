/**
 * Debug Configuration
 * 
 * This file controls debug mode and mock data settings for frontend development.
 * 
 * - DEBUG_MODE: When true, mock data is used instead of real API calls
 * - MOCK_ROLE: The role to use for mock authentication
 * 
 * For production or when backend is ready, set DEBUG_MODE = false
 */

export const DEBUG_MODE = false;

export const MOCK_ROLE: "GUEST" | "OWNER" | "CAREGIVER" | "ADMIN" = "ADMIN";