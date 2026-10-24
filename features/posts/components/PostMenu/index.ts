import { Menu } from '@/components/ui/Menu';
import { PostMenuRoot } from './PostMenuRoot';
import { DeletePostMenuItem } from './DeletePostMenuItem';
import { EditPostMenuItem } from './EditPostMenuItem';
import { CopyLinkMenuItem } from './CopyLinkMenuItem';
import { SharePostMenuItem } from './SharePostMenuItem';

export const PostMenu = {
  Root: PostMenuRoot,
  Title: Menu.Title,
  Item: Menu.Item,
  EditItem: EditPostMenuItem,
  DeleteItem: DeletePostMenuItem,
  CopyLinkItem: CopyLinkMenuItem,
  ShareItem: SharePostMenuItem,
};

export { PostMenuRoot, EditPostMenuItem, DeletePostMenuItem, CopyLinkMenuItem, SharePostMenuItem };
