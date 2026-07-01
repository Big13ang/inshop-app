import type { PendingPost } from '../features/posts/pending/types';

// Shared seed data for the dev-only /api/posts mock route and the MSW test
// handlers, so both surfaces describe the same fixture instead of drifting.
export function createPendingPostsFixture(): PendingPost[] {
  return [
    {
      id: 'pending-1',
      title: 'دستبند النگویی مدرن',
      sellerName: 'گالری طلای مدرن',
      sellerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
      isVerified: true,
      caption: 'دستبند النگویی فوق العاده مدرن با طراحی مینیمال.',
      mediaUrls: ['https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0'],
      submittedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      status: 'pending',
    },
    {
      id: 'rejected-1',
      title: 'انگشتر جواهر طرح رز کلاسیک',
      sellerName: 'گالری طلای مدرن',
      sellerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
      isVerified: true,
      caption: 'انگشتر جواهر طرح رز کلاسیک همراه با نگین برلیان.',
      mediaUrls: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908'],
      submittedAt: new Date(Date.now() - 60 * 60_000).toISOString(),
      status: 'rejected',
      rejectionReason: 'تصویر انتخابی تار است و جزئیات فیزیکی محصول به اندازه کافی مشخص نیست.',
    },
    {
      id: 'rejected-2',
      title: 'گوشواره زنجیری مدرن',
      sellerName: 'گالری طلای مدرن',
      sellerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
      isVerified: true,
      caption: 'گوشواره زنجیری مدرن با طراحی مروارید طبیعی پرورشی.',
      mediaUrls: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f'],
      submittedAt: new Date(Date.now() - 120 * 60_000).toISOString(),
      status: 'rejected',
      rejectionReason: 'توضیحات کپشن پست حاوی اطلاعات تماس شخصی مستقیم یا مسیر پرداخت خارج از پلتفرم است.',
    },
  ];
}
