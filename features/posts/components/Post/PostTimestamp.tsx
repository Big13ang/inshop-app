import { usePostContext } from './PostContext';

export function PostTimestamp() {
  const { state } = usePostContext();

  return (
    <span className="text-[10px] font-medium text-zinc-400">
      {new Date(state.post.createdAt).toLocaleDateString('fa-IR')}
    </span>
  );
}
