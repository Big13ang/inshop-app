/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import AddPostLoadingSkeleton from '../components/AddPostLoadingSkeleton';
import { text } from '../constants';

describe('AddPostLoadingSkeleton', () => {
  it('renders the loading spinner and Persian description text', () => {
    render(<AddPostLoadingSkeleton />);
    expect(screen.getByText(text.loadingSession)).toBeInTheDocument();
  });
});
