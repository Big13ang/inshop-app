import { createUploadService } from '../services/uploadService';
import { useMediaStore } from '../services/mediaStore';

describe('createUploadService', () => {
  beforeEach(() => {
    useMediaStore.setState({ mediaList: [], caption: '', isValidating: false, phase: 'select' });
  });

  it('instantiates upload service methods without throwing', () => {
    const service = createUploadService();

    expect(() => {
      service.enqueue([]);
      service.cancel('a');
      service.retry('a');
      service.cancelAll();
    }).not.toThrow();
  });
});
