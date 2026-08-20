import { Menu } from '@/components/ui/Menu';
import { PostMenuRoot } from './PostMenuRoot';
import { DeletePostMenuItem } from './DeletePostMenuItem';
import { CopyLinkMenuItem } from './CopyLinkMenuItem';
import { SharePostMenuItem } from './SharePostMenuItem';

export const PostMenu = {
  Root: PostMenuRoot,
  Title: Menu.Title,
  Item: Menu.Item,
  DeleteItem: DeletePostMenuItem,
  CopyLinkItem: CopyLinkMenuItem,
  ShareItem: SharePostMenuItem,
};

export { PostMenuRoot, DeletePostMenuItem, CopyLinkMenuItem, SharePostMenuItem };
