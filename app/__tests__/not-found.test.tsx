import { render, screen } from '@testing-library/react';
import NotFound from '../not-found';

describe('NotFound Page', () => {
  it('renders the inShop brand watermark in the center of the page', () => {
    render(<NotFound />);
    
    // The watermark name "inShop" should be present in the center of the page
    const watermark = screen.getByText('inShop');
    expect(watermark).toBeInTheDocument();
  });

  it('renders the Persian error message telling the user the page does not exist', () => {
    render(<NotFound />);
    
    const message = screen.getByText(/صفحه مورد نظر در اپلیکیشن وجود ندارد/i);
    expect(message).toBeInTheDocument();
  });

  it('renders the Home link and Login button with correct routes', () => {
    render(<NotFound />);
    
    const homeLink = screen.getByRole('link', { name: /صفحه اصلی/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');

    const loginLink = screen.getByRole('link', { name: /ورود به حساب/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/auth/login');
  });
});
