import type { SellerPost } from '../features/posts/services/postsQueryService';

// Shared seed data for the dev-only /api/posts mock route and the MSW test
// handlers, so both surfaces describe the same fixture instead of drifting.
export function createPendingPostsFixture(): SellerPost[] {
  return [
    {
      id: 'pending-1',
      sellerId: 'seller-1',
      description: 'دستبند النگویی فوق العاده مدرن با طراحی مینیمال.',
      media: [
        {
          id: 'media-p1',
          uploadSessionId: 'session-p1',
          sellerId: 'seller-1',
          postId: 'pending-1',
          status: 'ready',
          storageKey: 'photo-p1.jpg',
          originalFileName: 'photo-p1.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1000,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0'
        }
      ],
      createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      status: 'PENDING_REVIEW',
      rejectReason: null,
      reviewedBy: null,
      reviewedAt: null,
    },
    {
      id: 'rejected-1',
      sellerId: 'seller-1',
      description: 'انگشتر جواهر طرح رز کلاسیک همراه با نگین برلیان.',
      media: [
        {
          id: 'media-r1',
          uploadSessionId: 'session-r1',
          sellerId: 'seller-1',
          postId: 'rejected-1',
          status: 'ready',
          storageKey: 'photo-r1.jpg',
          originalFileName: 'photo-r1.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1000,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908'
        }
      ],
      createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 60_000).toISOString(),
      status: 'REJECTED',
      rejectReason: 'تصویر انتخابی تار است و جزئیات فیزیکی محصول به اندازه کافی مشخص نیست.',
      reviewedBy: 'admin-1',
      reviewedAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    },
    {
      id: 'rejected-2',
      sellerId: 'seller-1',
      description: 'گوشواره زنجیری مدرن با طراحی مروارید طبیعی پرورشی.',
      media: [
        {
          id: 'media-r2',
          uploadSessionId: 'session-r2',
          sellerId: 'seller-1',
          postId: 'rejected-2',
          status: 'ready',
          storageKey: 'photo-r2.jpg',
          originalFileName: 'photo-r2.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1000,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f'
        }
      ],
      createdAt: new Date(Date.now() - 120 * 60_000).toISOString(),
      updatedAt: new Date(Date.now() - 120 * 60_000).toISOString(),
      status: 'REJECTED',
      rejectReason: 'توضیحات کپشن پست حاوی اطلاعات تماس شخصی مستقیم یا مسیر پرداخت خارج از پلتفرم است.',
      reviewedBy: 'admin-1',
      reviewedAt: new Date(Date.now() - 120 * 60_000).toISOString(),
    },
  ];
}
