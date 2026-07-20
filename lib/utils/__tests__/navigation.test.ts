import { goBackSafely, getIsInternal, setIsInternal } from '../navigation';

describe('navigation utility', () => {
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = {
      back: jest.fn(),
      replace: jest.fn(),
    };
  });

  describe('automatic history tracking', () => {
    it('sets isInternal to true when pushState is called', () => {
      setIsInternal(false);
      expect(getIsInternal()).toBe(false);
      window.history.pushState({}, '', '/test-url-1');
      expect(getIsInternal()).toBe(true);
    });
  });

  describe('goBackSafely', () => {
    it('calls router.replace("/") if not internal', () => {
      setIsInternal(false);
      goBackSafely(mockRouter);
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
      expect(mockRouter.back).not.toHaveBeenCalled();
    });

    it('calls router.back() if internal', () => {
      setIsInternal(true);
      goBackSafely(mockRouter);
      expect(mockRouter.back).toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });
});
