import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostDescription } from '../PostDescription';
import { PostProvider } from '../PostProvider';
import type { BasePostData } from '../types';

const mockBasePost: BasePostData = {
  id: 'test-post-1',
  description: 'یک توضیح ساده برای تست',
  createdAt: '2026-09-01T12:00:00.000Z',
  sellerName: 'تست شاپ',
  sellerAvatar: '/test.jpg',
  isVerified: false,
};

function renderPostDescription(description: string) {
  return render(
    <PostProvider post={{ ...mockBasePost, description }}>
      <PostDescription />
    </PostProvider>,
  );
}

describe('PostDescription component', () => {
  it('renders single line description without truncate button', () => {
    renderPostDescription('این یک متن تستی ساده است.');

    expect(screen.getByText('این یک متن تستی ساده است.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /بیشتر/i })).not.toBeInTheDocument();
  });

  it('renders multiline text with whitespace-pre-wrap and break-words classes', () => {
    const multiline = 'خط اول\nخط دوم\nخط سوم';
    const { container } = renderPostDescription(multiline);

    const paragraph = container.querySelector('p');
    expect(paragraph).toHaveClass('whitespace-pre-wrap', 'break-words');
    expect(paragraph?.textContent).toContain('خط اول\nخط دوم\nخط سوم');
    expect(screen.queryByRole('button', { name: /بیشتر/i })).not.toBeInTheDocument();
  });

  it('does not ruin breaking lines when truncating more than 3 lines', async () => {
    const user = userEvent.setup();
    const fiveLines =
      'کفش اسپرت زنانه مدل جدید با کیفیت فوق‌العاده بالا\n' +
      'سایزبندی: ۳۷ تا ۴۰ در رنگ‌های متنوع\n' +
      'قیمت با تخفیف ویژه: ۵۵۰ هزار تومان\n' +
      'ارسال رایگان به سراسر کشور با پست پیشتاز\n' +
      'امکان تعویض سایز تا ۴۸ ساعت پس از تحویل';

    const { container } = renderPostDescription(fiveLines);
    const paragraph = container.querySelector('p');

    // First 3 lines should remain completely intact with their line breaks
    expect(paragraph?.textContent).toContain('کفش اسپرت زنانه مدل جدید با کیفیت فوق‌العاده بالا\n');
    expect(paragraph?.textContent).toContain('سایزبندی: ۳۷ تا ۴۰ در رنگ‌های متنوع\n');
    expect(paragraph?.textContent).toContain('قیمت با تخفیف ویژه: ۵۵۰ هزار تومان');

    // Lines 4 and 5 should NOT be shown yet
    expect(paragraph?.textContent).not.toContain('ارسال رایگان');
    expect(paragraph?.textContent).not.toContain('امکان تعویض سایز');

    // "...بیشتر" button should be present
    const moreBtn = screen.getByRole('button', { name: /بیشتر/i });
    expect(moreBtn).toBeInTheDocument();

    // Click more button to expand
    await user.click(moreBtn);

    // After expanding, all 5 lines should be visible with intact line breaks
    expect(paragraph?.textContent).toContain('ارسال رایگان به سراسر کشور با پست پیشتاز\n');
    expect(paragraph?.textContent).toContain('امکان تعویض سایز تا ۴۸ ساعت پس از تحویل');
    expect(screen.queryByRole('button', { name: /بیشتر/i })).not.toBeInTheDocument();
  });

  it('truncates continuous long text without line breaks at word boundary', async () => {
    const user = userEvent.setup();
    const longWords = 'کلمه '.repeat(50).trim(); // ~250 characters

    const { container } = renderPostDescription(longWords);
    const paragraph = container.querySelector('p');

    // Should be truncated
    expect(paragraph?.textContent).toContain('...بیشتر');

    const moreBtn = screen.getByRole('button', { name: /بیشتر/i });
    await user.click(moreBtn);

    // Fully expanded
    expect(paragraph?.textContent).toBe(longWords);
  });

  it('normalizes literal escaped \\\\n and \\\\r\\\\n into visual line breaks', () => {
    const escaped = 'خط اول\\nخط دوم\\r\\nخط سوم';
    const { container } = renderPostDescription(escaped);

    const paragraph = container.querySelector('p');
    expect(paragraph?.textContent).toContain('خط اول\nخط دوم\nخط سوم');
  });
});
