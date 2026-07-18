import { PostProvider } from './PostProvider';
import { PostRoot } from './PostRoot';
import { PostHeader, PostHeaderInfo, PostAuthorBlock, PostAuthorNameRow } from './PostHeader';
import { PostAvatar } from './PostAvatar';
import { PostAuthorName } from './PostAuthorName';
import { PostTimestamp } from './PostTimestamp';
import { PostMenuButton } from './PostMenuButton';
import { PostMedia } from './PostMedia';
import { PostStatusBadge } from './PostStatusBadge';
import { PostBody } from './PostBody';
import { PostCaption } from './PostCaption';
import { PostVerifiedBadge } from './PostVerifiedBadge';

export const Post = {
  Provider: PostProvider,
  Root: PostRoot,
  Header: PostHeader,
  HeaderInfo: PostHeaderInfo,
  AuthorBlock: PostAuthorBlock,
  AuthorNameRow: PostAuthorNameRow,
  Avatar: PostAvatar,
  AuthorName: PostAuthorName,
  Timestamp: PostTimestamp,
  MenuButton: PostMenuButton,
  Media: PostMedia,
  StatusBadge: PostStatusBadge,
  Body: PostBody,
  Caption: PostCaption,
  VerifiedBadge: PostVerifiedBadge,
};

export { usePostContext } from './PostContext';
export type { BasePostData } from './types';
