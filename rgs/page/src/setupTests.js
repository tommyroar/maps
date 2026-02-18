import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock mapbox-gl
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(() => ({
      on: vi.fn(),
      remove: vi.fn(),
      getCenter: vi.fn(() => ({ lng: -120, lat: 47 })),
      getZoom: vi.fn(() => 6.5),
    })),
  }
}));
