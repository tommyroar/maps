import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock mapbox-gl
vi.mock('mapbox-gl', () => {
  return {
    default: {
      accessToken: '',
      Map: class {
        constructor() {
          this.on = vi.fn();
          this.remove = vi.fn();
          this.getCenter = vi.fn(() => ({ lng: -120, lat: 47 }));
          this.getZoom = vi.fn(() => 6.5);
        }
      },
    },
  };
});
