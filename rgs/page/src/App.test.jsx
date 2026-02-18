import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('RGS App', () => {
  it('renders title', () => {
    // We expect the text "Robot Geographical Society" to be in the document
    // We wrap in a check for mapboxgl to avoid issues in test env if mapboxgl is not fully mocked
    render(<App />);
    expect(screen.getByText(/Robot Geographical Society/i)).toBeInTheDocument();
  });
});
