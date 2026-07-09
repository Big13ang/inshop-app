import { render, screen, fireEvent, within } from '@testing-library/react';
import { FooterTab, FooterNavRoot, FooterButton, FooterRoot, FooterNav } from '../Footer';
import { Clock } from 'lucide-react';

describe('FooterTab', () => {
  it('renders successfully with custom CSS class', () => {
    render(
      <FooterTab
        icon={Clock}
        className="custom-class"
        aria-label="Clock Tab"
      />
    );
    const button = screen.getByRole('button', { name: 'Clock Tab' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('custom-class');
  });

  it('renders with default icon styling when icon is provided and is inactive', () => {
    render(
      <FooterTab
        icon={Clock}
        isActive={false}
        aria-label="Clock Tab"
      />
    );
    const button = screen.getByRole('button', { name: 'Clock Tab' });
    const icon = within(button).getByTestId('tab-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('fill', 'none');
    expect(icon).toHaveAttribute('stroke-width', '2');
    expect(button).not.toHaveAttribute('aria-current');
  });

  it('renders with active icon styling when icon is provided and isActive is true', () => {
    render(
      <FooterTab
        icon={Clock}
        isActive={true}
        aria-label="Clock Tab"
      />
    );
    const button = screen.getByRole('button', { name: 'Clock Tab' });
    const icon = within(button).getByTestId('tab-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('fill', 'currentColor');
    expect(icon).toHaveAttribute('stroke-width', '2.5');
    expect(button).toHaveAttribute('aria-current', 'page');
  });

  it('renders custom content when customRender is provided', () => {
    const customRender = jest.fn((isActive) => (
      <span data-testid="custom-content">Active: {isActive ? 'yes' : 'no'}</span>
    ));

    const { rerender } = render(
      <FooterTab
        customRender={customRender}
        isActive={false}
        aria-label="Custom Tab"
      />
    );

    expect(customRender).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('custom-content')).toHaveTextContent('Active: no');

    rerender(
      <FooterTab
        customRender={customRender}
        isActive={true}
        aria-label="Custom Tab"
      />
    );

    expect(customRender).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('custom-content')).toHaveTextContent('Active: yes');
  });

  it('renders nothing if neither icon nor customRender is provided', () => {
    render(<FooterTab aria-label="Empty Tab" />);
    const button = screen.getByRole('button', { name: 'Empty Tab' });
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe('');
    expect(button.querySelector('svg')).toBeNull();
  });

  it('passes standard HTML button attributes to the underlying button', () => {
    const handleClick = jest.fn();
    render(
      <FooterTab
        icon={Clock}
        disabled={true}
        onClick={handleClick}
        aria-label="Click Tab"
      />
    );

    const button = screen.getByRole('button', { name: 'Click Tab' });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe('FooterNavRoot', () => {
  const mockOnPress1 = jest.fn();
  const mockOnPress2 = jest.fn();
  
  const tabs = [
    {
      id: 'tab-1',
      icon: Clock,
      label: 'Tab One',
      onPress: mockOnPress1,
    },
    {
      id: 'tab-2',
      icon: Clock,
      label: 'Tab Two',
      onPress: mockOnPress2,
      isActionButton: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a list of tabs inside navigation container with styling', () => {
    render(
      <FooterNavRoot
        activeTab="tab-1"
        tabs={tabs}
        className="nav-custom-class"
        style={{ opacity: 0.8 }}
      />
    );

    const nav = screen.getByRole('navigation', { name: 'Bottom Navigation' });
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('nav-custom-class');
    expect(nav).toHaveStyle({ opacity: 0.8 });

    expect(screen.getByLabelText('Tab One')).toBeInTheDocument();
    expect(screen.getByLabelText('Tab Two')).toBeInTheDocument();
  });

  it('sets active tab state correctly and handles action buttons', () => {
    const { rerender } = render(
      <FooterNavRoot
        activeTab="tab-1"
        tabs={tabs}
      />
    );

    const tabOne = screen.getByRole('button', { name: 'Tab One' });
    const tabTwo = screen.getByRole('button', { name: 'Tab Two' });

    expect(tabOne).toHaveAttribute('aria-current', 'page');
    // Action buttons must never have isActive=true even if their ID matches activeTab
    expect(tabTwo).not.toHaveAttribute('aria-current');

    rerender(
      <FooterNavRoot
        activeTab="tab-2"
        tabs={tabs}
      />
    );

    // Rerender checks:
    // tabOne is no longer active
    expect(tabOne).not.toHaveAttribute('aria-current');
    // tabTwo matches activeTab, but isActionButton is true, so it must not be active
    expect(tabTwo).not.toHaveAttribute('aria-current');
  });

  it('triggers onPress callback when tab is clicked', () => {
    render(
      <FooterNavRoot
        activeTab="tab-1"
        tabs={tabs}
      />
    );

    const tabOne = screen.getByRole('button', { name: 'Tab One' });
    fireEvent.click(tabOne);

    expect(mockOnPress1).toHaveBeenCalledTimes(1);
    expect(mockOnPress1).toHaveBeenCalledWith('tab-1');
    expect(mockOnPress2).not.toHaveBeenCalled();
  });

  it('forwards disabled state and prevents click handler when disabled is true', () => {
    const disabledTabs = [
      {
        id: 'tab-1',
        icon: Clock,
        label: 'Tab One',
        onPress: mockOnPress1,
        disabled: true,
      },
    ];

    render(
      <FooterNavRoot
        activeTab="tab-2"
        tabs={disabledTabs}
      />
    );

    const tabOne = screen.getByRole('button', { name: 'Tab One' });
    expect(tabOne).toBeDisabled();

    fireEvent.click(tabOne);
    expect(mockOnPress1).not.toHaveBeenCalled();
  });
});

describe('FooterButton', () => {
  it('triggers onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(
      <FooterButton onClick={handleClick}>
        Click Me
      </FooterButton>
    );

    const button = screen.getByRole('button', { name: 'Click Me' });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prevents click events when disabled is true', () => {
    const handleClick = jest.fn();
    render(
      <FooterButton onClick={handleClick} disabled={true}>
        Disabled Button
      </FooterButton>
    );

    const button = screen.getByRole('button', { name: 'Disabled Button' });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('correctly forwards ref to the underlying button element', () => {
    const ref = { current: null };
    render(
      <FooterButton ref={ref}>
        Ref Button
      </FooterButton>
    );

    const button = screen.getByRole('button', { name: 'Ref Button' });
    expect(ref.current).toBe(button);
  });
});

describe('FooterRoot', () => {
  it('renders children correctly', () => {
    render(
      <FooterRoot>
        <span data-testid="child-element">Child Content</span>
      </FooterRoot>
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByTestId('child-element')).toHaveTextContent('Child Content');
  });
});

describe('FooterNav', () => {
  it('renders children correctly', () => {
    render(
      <FooterNav>
        <span data-testid="child-element">Child Navigation</span>
      </FooterNav>
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByTestId('child-element')).toHaveTextContent('Child Navigation');
  });
});



