// This focused interaction test verifies the exact regression reported by the user.
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

// Remove each rendered app so queries in the next test cannot see stale controls.
afterEach(cleanup);

describe('CSV upload feedback', () => {
  it('shows persistent and notification feedback after a real file-input change', () => {
    render(<App />);
    const csv = new File(['feature,target\n1,yes'], 'training.csv', { type: 'text/csv' });

    fireEvent.change(screen.getByLabelText('Training CSV'), {
      target: { files: [csv] },
    });

    expect(screen.getByText('CSV loaded successfully')).toBeVisible();
    expect(screen.getByText(/training\.csv · 20 B/)).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Dataset ready');
    expect(screen.getByRole('status')).toHaveTextContent('training.csv loaded successfully');
  });

  it('shows a specific error and then recovers after a valid CSV is selected', () => {
    render(<App />);
    const input = screen.getByLabelText('Training CSV');
    fireEvent.change(input, {
      target: { files: [new File(['not csv'], 'notes.txt', { type: 'text/plain' })] },
    });

    expect(screen.getByText('CSV could not be loaded')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Unsupported file type');

    fireEvent.change(input, {
      target: { files: [new File(['a,b\n1,2'], 'recovery.csv', { type: 'text/csv' })] },
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('recovery.csv loaded successfully');
  });
});
