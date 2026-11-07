import { Button } from '@/components/ui/button';
import { getActiveChildren } from '@/features/categories/utils/categoryTree';
import type { CategoryNode } from '@/features/categories/types';
import { text } from '../constants';
import { CategoryOption } from './CategoryOption';

interface CategoryPickerListProps {
  categories: CategoryNode[];
  nodes: CategoryNode[];
  selectedId: string;
  isError: boolean;
  onRetry: () => void;
  onSelect: (node: CategoryNode) => void;
}

export function CategoryPickerList({ categories, nodes, selectedId, isError, onRetry, onSelect }: CategoryPickerListProps) {
  function renderContent() {
    if (isError) {
      return <LoadError onRetry={onRetry} />;
    }

    if (nodes.length === 0) {
      return <p className="py-12 text-center text-sm font-medium text-stone-400">{text.categoryEmpty}</p>;
    }

    return nodes.map((node) => (
      <CategoryOption
        key={node.id}
        node={node}
        isSelected={node.id === selectedId}
        hasChildren={getActiveChildren(categories, node.id).length > 0}
        onSelect={onSelect}
      />
    ));
  }

  return (
    <div
      data-vaul-no-drag
      role="listbox"
      className="h-[calc(52.5dvh-110px)] overflow-y-auto overscroll-contain p-1.5 custom-scrollbar"
    >
      {renderContent()}
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-sm font-medium text-stone-500">{text.categoryLoadFailed}</p>
      <Button type="button" variant="outline" onClick={onRetry}>
        {text.categoryRetry}
      </Button>
    </div>
  );
}
