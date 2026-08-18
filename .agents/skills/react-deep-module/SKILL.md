---
name: react-deep-module
description: Guidelines and patterns for building deep, isolated React components. Focuses on eliminating prop drilling, removing unnecessary state & useEffect via derived values, encapsulating routing & interactions, and adding pragmatic props for reusable controls.
---

# Deep React Module & Component Skill

Guidelines for building **Deep Components** in React and Next.js applications. A deep component provides a simple, clean interface (low prop count) while encapsulating rich functionality, internal state, subcomponent assembly, and router interactions inside.

---

## Core Philosophy

> **"Deep modules provide powerful functionality through a simple interface. Shallow modules have complex interfaces for relatively simple functionality."** — John Ousterhout (*A Philosophy of Software Design*)

In React applications, shallow components proliferate when every subcomponent requires 8–12 drilled callback props (`onNavigateSeller`, `onNavigateShop`, `onBookmark`, `onLike`, `onOpenMenu`, `isLiked`, `isBookmarked`, etc.) to delegate basic behavior upwards. 

**Deep React Components** solve this by being self-contained, autonomous, and clean.

---

## 1. Key Principles

### Principle 1: Eliminate Prop Drilling via Local Autonomy
- **Page & Feature Modules**: Should accept **minimal or zero required props** (`<Feed />`, `<UserProfile />`). They manage their own layout, filter states, modal triggers, and router navigation internally.
- **Direct Router Navigation**: Use Next.js `useRouter()` inside deep subcomponents (`router.push('/handle')`) instead of passing navigation callback functions down 3 component tiers.
- **Context-Backed Compound Components**: For complex components (`PostCard`), expose subcomponents (`PostCard.Header`, `PostCard.Media`, `PostCard.Actions`, `PostCard.Caption`) backed by a lightweight context provider. Subcomponents take **0 props**.

---

### Principle 2: Eliminate Unnecessary State & `useEffect`
- **Derived State During Render**: Calculate filtered lists, search matches, and formatted captions directly in the render function. Never store derived data in `useState` or update it via `useEffect`.
- **Event-Driven Side Effects**: Execute actions (API calls, toasts, navigation) directly in event handlers (`onClick`, `onDoubleClick`). Do not set state solely to trigger a `useEffect`.
- **CSS Animation Callbacks**: Use `onAnimationEnd` on animated elements to clear transient animation flags (e.g. heart pop overlay) without timers or `useEffect` hooks.

---

### Principle 3: Pragmatic Props & Reusability
Not every component should have zero props. Distinguish between **Feature Modules** and **Reusable Controls**:

| Component Type | Goal | Prop Strategy | Example |
| :--- | :--- | :--- | :--- |
| **Feature / Page Module** | Encapsulate full user flows | **0 required props** | `<Feed />`, `<UserProfile />` |
| **Compound Subcomponents** | Clean internal structure | **0 props** | `<PostCard.Header />`, `<PostCard.Actions />` |
| **Reusable UI Primitives** | Maximum flexibility across features | **Focused variability props only** | `<Button variant="..." />`, `<GridTile post={post} />` |

**Rule of Thumb**: Add props ONLY when a component is designed to be reused in multiple distinct contexts where the behavior or data legitimately varies. Avoid adding boolean flags (`showFooter`, `enableSearch`, `isHeaderCompact`) that pollute the interface.

---

## 2. Before & After Examples

### ❌ Bad: Shallow Component (Prop Drilling & Effect Thrashing)

```tsx
// ❌ Shallow component accepting 10 props & using useEffect for derived state
interface PostCardProps {
  post: Post;
  isLiked: boolean;
  isBookmarked: boolean;
  onNavigateSeller: (name: string) => void;
  onNavigateShop: (shop: string) => void;
  onNavigateChat: (seller: string) => void;
  onBookmarkToggle: (id: string) => void;
  onLikeToggle: (id: string) => void;
  onOpenMenu: (id: string) => void;
}

export function PostCard({
  post,
  isLiked,
  isBookmarked,
  onNavigateSeller,
  onNavigateShop,
  onNavigateChat,
  onBookmarkToggle,
  onLikeToggle,
  onOpenMenu,
}: PostCardProps) {
  const [filteredCaption, setFilteredCaption] = useState('');

  // ❌ Anti-pattern: Syncing derived state in useEffect
  useEffect(() => {
    setFilteredCaption(post.caption.slice(0, 95));
  }, [post.caption]);

  return (
    <div>
      <Header seller={post.sellerName} onClick={() => onNavigateSeller(post.sellerName)} />
      <Actions onChat={() => onNavigateChat(post.sellerName)} onMenu={() => onOpenMenu(post.id)} />
    </div>
  );
}
```

---

### ✅ Good: Deep Component (Clean 1-Prop Interface, Derived State, Self-Contained Actions)

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ✅ Deep Component Interface: 1 single prop!
export function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(Boolean(post.isBookmarked));
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);

  // ✅ Derived data computed during render (zero useEffect)
  const isLongCaption = post.caption.length > 95;
  const displayedCaption = isLongCaption ? `${post.caption.slice(0, 95)}...` : post.caption;

  // ✅ Self-contained event handlers
  const handleSellerClick = () => router.push(`/${post.sellerName}`);
  const handleChatClick = () => router.push(`/chat?seller=${post.sellerName}`);
  const handleDoubleTap = () => setShowHeartOverlay(true);
  const handleAnimationEnd = () => setShowHeartOverlay(false); // Zero useEffect timer

  return (
    <article className="bg-white border-b">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={handleSellerClick} className="font-bold">{post.sellerName}</button>
      </div>

      {/* Media with self-clearing heart pop */}
      <div className="relative aspect-square" onDoubleClick={handleDoubleTap}>
        <img src={post.images[0]} alt={post.sellerName} />
        {showHeartOverlay && (
          <div className="animate-ping" onAnimationEnd={handleAnimationEnd}>❤️</div>
        )}
      </div>

      {/* Actions & Caption */}
      <div className="p-4">
        <button onClick={handleChatClick} className="btn-primary">خریدارم</button>
        <p>{displayedCaption}</p>
      </div>
    </article>
  );
}
```

---

## 3. Checklist for Deep Components

- [ ] Does the page/feature component require **0 required props**?
- [ ] Are subcomponents (`Header`, `Actions`, `Media`) taking **0 props** when using Compound Context?
- [ ] Are navigation actions handled internally using Next.js `useRouter()` instead of callback props?
- [ ] Are derived values (filtered lists, search results, formatted text) computed directly during render without `useEffect`?
- [ ] Are side-effects executed in event handlers or animation callbacks (`onAnimationEnd`) rather than state-syncing effects?
- [ ] Are props restricted strictly to reusable UI controls (`<Button>`, `<GridTile>`) where genuine variability is needed?
