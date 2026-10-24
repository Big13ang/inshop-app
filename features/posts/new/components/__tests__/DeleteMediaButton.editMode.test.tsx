import { render, screen } from '@testing-library/react';
import { useMediaStore } from '../../services/mediaStore';
import DeleteMediaButton from '../DeleteMediaButton';

jest.mock('../../services/uploadSession', () => ({
  useUploadSession: () => ({ data: { uploadSessionId: 'session-1' } }),
}));

jest.mock('../../services/submitPostService', () => ({
  useDeleteUploadSessionPhoto: () => ({ isPending: false, mutate: jest.fn() }),
}));

describe('DeleteMediaButton in edit mode', () => {
  afterEach(() => {
    useMediaStore.getState().reset();
  });

  it('is disabled while editing a saved post', () => {
    useMediaStore.setState({ isEditing: true });

    render(<DeleteMediaButton mediaId="media-1" />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('stays enabled in the new-post flow', () => {
    useMediaStore.setState({ isEditing: false });

    render(<DeleteMediaButton mediaId="media-1" />);

    expect(screen.getByRole('button')).toBeEnabled();
  });
});
