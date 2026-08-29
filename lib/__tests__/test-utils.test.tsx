import { render, screen, expect, isMutationTest } from '@/lib/test-utils';

describe('test-utils - toBeToggled custom matcher', () => {
  it('should match aria-pressed toggle buttons', () => {
    render(<button aria-pressed="true">Toggle</button>);
    const button = screen.getByRole('button');

    expect(button).toBeToggled(true);
    expect(button).toBeToggled();
  });

  it('should match un-toggled aria-pressed buttons', () => {
    render(<button aria-pressed="false">Toggle</button>);
    const button = screen.getByRole('button');

    expect(button).toBeToggled(false);
  });

  it('should match data-state toggle elements', () => {
    render(<div data-testid="accordion" data-state="open" />);
    const div = screen.getByTestId('accordion');

    expect(div).toBeToggled(true);
  });

  it('should match HTML checkbox inputs', () => {
    render(<input type="checkbox" defaultChecked />);
    const checkbox = screen.getByRole('checkbox');

    expect(checkbox).toBeToggled(true);
  });
});

describe('test-utils - Mutation Testing Flag', () => {
  it('should export mutation test flag and expose it on expect', () => {
    expect(typeof isMutationTest).toBe('boolean');
    expect(typeof expect.isMutation).toBe('boolean');
    expect(typeof expect.isMutationTest).toBe('boolean');
    expect(expect.isMutation).toBe(isMutationTest);
  });
});
