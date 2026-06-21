import { usePostContext } from './PostContext';

export function PostCaption() {
  const { state } = usePostContext();

  return <p className="text-[13px] text-secondary leading-6 text-justify">{state.post.caption}</p>;
}
