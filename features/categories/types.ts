// Mirrors the backend `CategoryView` returned by GET /categories/tree (inshop-backend src/category/category.service.ts).
export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
  isLeaf: boolean;
  selectable: boolean;
}

export interface CategoryTreeData {
  categories: CategoryNode[];
}
