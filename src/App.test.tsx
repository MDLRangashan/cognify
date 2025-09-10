import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders children management system', () => {
  render(<App />);
  const linkElement = screen.getByText(/Children Management System/i);
  expect(linkElement).toBeInTheDocument();
});
