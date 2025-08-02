import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MapPin, Loader2 } from 'lucide-react';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeData?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Declare global Google Maps types
declare global {
  interface Window {
    google?: typeof google;
    initGoogleMaps?: () => void;
  }
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter your address",
  className,
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Google Maps API key - in production, this should be from environment variables
  const GOOGLE_MAPS_API_KEY = "AIzaSyBHD3o4YeG2KnlL_jFdWw4GYqI6_yP_XuY"; // Replace with your API key

  const loadGoogleMapsScript = () => {
    return new Promise<void>((resolve, reject) => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleMapsLoaded(true);
        setIsLoading(false);
        resolve();
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Wait for the existing script to load
        window.initGoogleMaps = () => {
          setIsGoogleMapsLoaded(true);
          setIsLoading(false);
          resolve();
        };
        return;
      }

      // Create and load the script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      window.initGoogleMaps = () => {
        setIsGoogleMapsLoaded(true);
        setIsLoading(false);
        resolve();
      };

      script.onerror = () => {
        setIsLoading(false);
        reject(new Error('Failed to load Google Maps'));
      };

      document.head.appendChild(script);
    });
  };

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    try {
      // Create autocomplete instance
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }, // Restrict to US addresses
        fields: [
          'address_components',
          'formatted_address',
          'geometry',
          'place_id',
          'name'
        ]
      });

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (place && place.formatted_address) {
          onChange(place.formatted_address, place);
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
  };

  useEffect(() => {
    loadGoogleMapsScript().catch((error) => {
      console.error('Failed to load Google Maps:', error);
    });
  }, []);

  useEffect(() => {
    if (isGoogleMapsLoaded && !autocompleteRef.current) {
      initializeAutocomplete();
    }
  }, [isGoogleMapsLoaded]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleInputFocus = () => {
    // Re-initialize autocomplete if needed
    if (isGoogleMapsLoaded && !autocompleteRef.current) {
      initializeAutocomplete();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("pl-10", className)}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {!isGoogleMapsLoaded && !isLoading && (
        <div className="mt-1 text-xs text-muted-foreground">
          ⚠️ Google Maps not available. Manual address entry only.
        </div>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
