export function PostHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between px-4 py-3">{children}</div>;
}

export function PostHeaderInfo({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3">{children}</div>;
}

export function PostAuthorBlock({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col text-right">{children}</div>;
}

export function PostAuthorNameRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1.5">{children}</div>;
}
