'use client';

import { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            inputField: HTMLInputElement,
            options?: {
              componentRestrictions?: { country: string };
              fields?: string[];
              types?: string[];
            }
          ) => {
            addListener: (event: string, callback: () => void) => void;
            getPlace: () => google.maps.places.PlaceResult;
          };
        };
      };
    };
  }
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: {
    line1: string;
    suburb: string;
    city: string;
  }) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  error?: boolean;
  'aria-describedby'?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onInputChange,
  placeholder = 'e.g., 123 Nelson Mandela Avenue',
  className,
  id,
  error,
  'aria-describedby': ariaDescribedBy,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  // Load Google Maps script (only once globally)
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Places API key not found');
      return;
    }

    // Check if script is already loaded
    if (
      typeof window !== 'undefined' &&
      window.google &&
      window.google.maps &&
      window.google.maps.places
    ) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded (in DOM but not loaded yet)
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com/maps/api/js"]`
    );
    
    if (existingScript) {
      // Script tag exists but may still be loading; add a listener
      (existingScript as HTMLScriptElement).addEventListener('load', () => {
        if (inputRef.current && window.google?.maps?.places) {
          setIsLoaded(true);
        }
      });
      return;
    }

    // Script doesn't exist, create and load it
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (inputRef.current && window.google?.maps?.places) {
        setIsLoaded(true);
      }
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };

    document.head.appendChild(script);
  }, []);

  // Initialize autocomplete when script loads
  useEffect(() => {
    if (isLoaded && inputRef.current) {
      initializeAutocomplete();
    }
  }, [isLoaded]);

  // Initialize autocomplete when script loads
  const initializeAutocomplete = () => {
    if (
      !inputRef.current ||
      typeof window === 'undefined' ||
      !window.google?.maps?.places ||
      autocompleteRef.current // Already initialized
    ) {
      return;
    }

    // Create autocomplete instance using the Google Maps API
    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'za' }, // Restrict to South Africa
        fields: ['address_components', 'formatted_address'],
        types: ['address'],
      }
    );

    autocompleteRef.current = autocomplete;

    // Handle place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.address_components) {
        return;
      }

      // Parse address components for South African addresses
      const addressComponents = place.address_components;
      let line1 = '';
      let suburb = '';
      let city = '';

      // Find street address
      const streetNumber = addressComponents.find(
        (component) => component.types.includes('street_number')
      );
      const route = addressComponents.find(
        (component) => component.types.includes('route')
      );
      
      if (streetNumber) {
        line1 = streetNumber.long_name;
      }
      if (route) {
        line1 = line1 ? `${line1} ${route.long_name}` : route.long_name;
      }
      if (!line1 && place.formatted_address) {
        // Fallback: use formatted address and try to extract street
        const parts = place.formatted_address.split(',');
        line1 = parts[0] || '';
      }

      // Find suburb (sublocality_level_1 or locality)
      const suburbComponent = addressComponents.find(
        (component) =>
          component.types.includes('sublocality_level_1') ||
          component.types.includes('sublocality') ||
          component.types.includes('locality')
      );
      if (suburbComponent) {
        suburb = suburbComponent.long_name;
      }

      // Find city (administrative_area_level_1 or locality as fallback)
      const cityComponent = addressComponents.find(
        (component) =>
          component.types.includes('administrative_area_level_1') ||
          component.types.includes('locality')
      );
      if (cityComponent) {
        // If we haven't found suburb and this is locality, use it for suburb
        if (!suburb && cityComponent.types.includes('locality')) {
          suburb = cityComponent.long_name;
          // Try to find actual city
          const adminArea = addressComponents.find(
            (c) => c.types.includes('administrative_area_level_1')
          );
          city = adminArea ? adminArea.long_name : cityComponent.long_name;
        } else {
          city = cityComponent.long_name;
        }
      }

      // If city is still empty, try postal_town or administrative_area_level_2
      if (!city) {
        const postalTown = addressComponents.find(
          (component) => component.types.includes('postal_town')
        );
        const adminLevel2 = addressComponents.find(
          (component) => component.types.includes('administrative_area_level_2')
        );
        city = postalTown?.long_name || adminLevel2?.long_name || '';
      }

      // Update state
      setInputValue(line1 || place.formatted_address || '');
      onChange({
        line1: line1 || place.formatted_address || '',
        suburb: suburb || '',
        city: city || '',
      });
    });
  };

  // Update input value when external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onInputChange?.(newValue);
  };

  return (
    <Input
      ref={inputRef}
      id={id}
      value={inputValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={className}
      aria-describedby={ariaDescribedBy}
    />
  );
}

