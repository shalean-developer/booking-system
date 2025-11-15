/**
 * Booking form validation utilities
 * Comprehensive validation for all booking steps
 */

import type { BookingState } from '@/types/booking';
import { isValidEmail, isValidSAPhone, requiresTeam } from './booking-utils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate complete booking state before payment
 */
export function validateBookingForPayment(state: BookingState): ValidationResult {
  const errors: string[] = [];

  // Service validation
  if (!state.service) {
    errors.push('Service type is required');
  }

  // Date and time validation
  if (!state.date) {
    errors.push('Booking date is required');
  } else {
    const selectedDate = new Date(state.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      errors.push('Booking date must be today or in the future');
    }
  }

  if (!state.time) {
    errors.push('Booking time is required');
  }

  // Contact information validation
  if (!state.firstName || state.firstName.length < 2) {
    errors.push('First name is required (minimum 2 characters)');
  }

  if (!state.lastName || state.lastName.length < 2) {
    errors.push('Last name is required (minimum 2 characters)');
  }

  if (!state.email) {
    errors.push('Email address is required');
  } else if (!isValidEmail(state.email)) {
    errors.push('Please enter a valid email address');
  }

  if (!state.phone) {
    errors.push('Phone number is required');
  } else if (!isValidSAPhone(state.phone)) {
    errors.push('Please enter a valid South African phone number');
  }

  // Address validation
  if (!state.address.line1 || state.address.line1.length < 5) {
    errors.push('Street address is required (minimum 5 characters)');
  }

  if (!state.address.suburb || state.address.suburb.length < 2) {
    errors.push('Suburb is required (minimum 2 characters)');
  }

  if (!state.address.city || state.address.city.length < 2) {
    errors.push('City is required (minimum 2 characters)');
  }

  // Cleaner/Team validation
  const needsTeam = requiresTeam(state.service);
  if (needsTeam) {
    if (!state.selected_team) {
      errors.push('Team selection is required for this service type');
    }
  } else {
    // For individual services, cleaner_id must be set (can be 'manual')
    if (!state.cleaner_id) {
      errors.push('Please select a cleaner or request manual assignment');
    }
  }

  // Bathroom validation (minimum 1 required)
  if (state.bathrooms < 1) {
    errors.push('At least 1 bathroom is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate pricing before payment
 */
export function validatePricing(total: number): ValidationResult {
  const errors: string[] = [];

  if (!total || total <= 0) {
    errors.push('Pricing information is not available. Please refresh the page.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate payment configuration
 */
export function validatePaymentConfig(email: string, publicKey: string | undefined): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email is required for payment');
  } else if (!isValidEmail(email)) {
    errors.push('Please enter a valid email address');
  }

  if (!publicKey) {
    errors.push('Payment service is not configured. Please contact support.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

