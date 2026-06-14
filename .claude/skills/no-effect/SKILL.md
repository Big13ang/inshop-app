---
name: no-effect
description: >
  React guidance for eliminating unnecessary useEffect calls. Use this skill whenever
  you see or write a useEffect, whenever the user asks "do I need a useEffect", whenever
  a component has state that's derived from other state/props, whenever you see chained
  Effects, Effect-based event handling, parent notification via Effect, or state resets
  in Effects. Also triggers on "why is my effect running twice", "useEffect dependency
  array", "effect cleanup", or any component pasted that contains useEffect. When in
  doubt, consult this skill — most useEffects in application code are unnecessary.
---

# You Might Not Need an Effect

Effects are an **escape hatch** for syncing with things *outside* React (browser APIs, third-party widgets, network). If no external system is involved, you probably don't need one.

> **This project uses React Compiler.** Expensive calculations are memoized automatically — never add `useMemo` manually. The patterns below reflect this.

---

## Quick Decision

```
Does this code need to run...

Because the component was DISPLAYED?  →  Effect (or useSyncExternalStore)
Because of a specific USER ACTION?     →  Event handler
Can it be calculated from props/state? →  Just calculate it at render time
Does it reset state when a prop changes? → Use the `key` prop
```

---

## Anti-Patterns and Their Fixes

### 1. Derived state in an Effect

```tsx
// ❌ Two render passes, stale intermediate state
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// ✅ Calculate at render time
const fullName = firstName + ' ' + lastName;
```

**Rule:** If you can compute something from existing props or state, do it directly — no state, no Effect.

---

### 2. User event logic in an Effect

```tsx
// ❌ Fires on mount/refresh if product.isInCart is true
useEffect(() => {
  if (product.isInCart) {
    showNotification(`Added ${product.name} to cart!`);
  }
}, [product]);

// ✅ Show notification where the action happens
function handleBuyClick() {
  addToCart(product);
  showNotification(`Added ${product.name} to cart!`);
}
```

**Rule:** Effects run because a component was *displayed*. User interactions belong in event handlers.

---

### 3. State reset when a prop changes

```tsx
// ❌ Children render once with stale state, then again after the Effect
useEffect(() => {
  setComment('');
}, [userId]);

// ✅ Tell React this is a different component instance
<Profile key={userId} userId={userId} />
// Profile's state resets automatically when key changes
```

**Rule:** When you need to wipe *all* state for a new prop value, pass `key`. React destroys and recreates the subtree.

---

### 4. Adjusting *some* state when a prop changes

```tsx
// ❌ Extra render with stale selection
useEffect(() => {
  setSelection(null);
}, [items]);

// ✅ Option A: store only the ID, derive selection during render
const selection = items.find(item => item.id === selectedId) ?? null;

// ✅ Option B: update state during render (unusual but valid)
const [prevItems, setPrevItems] = useState(items);
if (items !== prevItems) {
  setPrevItems(items);
  setSelectedId(null);
}
```

---

### 5. Chained Effects

```tsx
// ❌ Each setX triggers another Effect → multiple re-renders
useEffect(() => {
  if (card?.gold) setGoldCardCount(c => c + 1);
}, [card]);

useEffect(() => {
  if (goldCardCount > 3) setRound(r => r + 1);
}, [goldCardCount]);

// ✅ Compute everything in the event handler in one pass
function handlePlaceCard(nextCard) {
  setCard(nextCard);
  const nextGoldCount = nextCard.gold ? goldCardCount + 1 : goldCardCount;
  const nextRound = nextGoldCount > 3 ? round + 1 : round;
  setGoldCardCount(nextGoldCount > 3 ? 0 : nextGoldCount);
  setRound(nextRound);
}
```

**Rule:** If Effects trigger other Effects, flatten them into a single event handler.

---

### 6. Notifying a parent component

```tsx
// ❌ Parent re-renders after child already re-rendered
useEffect(() => {
  onChange(isOn);
}, [isOn, onChange]);

// ✅ Update both in the same handler
function handleClick() {
  const next = !isOn;
  setIsOn(next);
  onChange(next);
}

// ✅✅ Or make it fully controlled — lift state up
function Toggle({ isOn, onChange }) {
  return <button onClick={() => onChange(!isOn)}>{isOn ? 'On' : 'Off'}</button>;
}
```

---

### 7. POST requests

```tsx
// ❌ Analytics vs form submission look the same but are different
useEffect(() => {
  post('/api/register', { firstName, lastName }); // Wrong — user triggered this
}, []);

// ✅ Analytics (runs because component appeared) → Effect is correct
useEffect(() => {
  post('/analytics/event', { eventName: 'visit_form' });
}, []);

// ✅ Form submission (user triggered) → event handler
function handleSubmit(e) {
  e.preventDefault();
  post('/api/register', { firstName, lastName });
}
```

---

### 8. App initialization

```tsx
// ❌ Runs twice in Strict Mode dev
useEffect(() => {
  loadDataFromLocalStorage();
  checkAuthToken();
}, []);

// ✅ Module-level (runs once before React renders)
if (typeof window !== 'undefined') {
  checkAuthToken();
  loadDataFromLocalStorage();
}
```

---

## Patterns Where Effects ARE Correct

### Data fetching — always add a cleanup to prevent race conditions

```tsx
useEffect(() => {
  let ignore = false;

  fetch(`/api/search?q=${query}`)
    .then(r => r.json())
    .then(data => {
      if (!ignore) setResults(data);
    });

  return () => { ignore = true; };
}, [query]);
```

Extract to a custom hook (`useData(url)`) when you reuse the pattern.

---

### External store subscriptions — use `useSyncExternalStore`

```tsx
// ❌ Effect-based subscription (works but fragile)
useEffect(() => {
  const update = () => setIsOnline(navigator.onLine);
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
}, []);

// ✅ useSyncExternalStore
function subscribe(cb) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb); };
}

const isOnline = useSyncExternalStore(
  subscribe,
  () => navigator.onLine,
  () => true  // server snapshot
);
```

---

## Summary Table

| Situation | Fix |
|---|---|
| Value derived from props/state | Calculate at render time |
| Side effect from user action | Move to event handler |
| Reset all state on prop change | `key` prop |
| Reset some state on prop change | Store the ID, derive value at render |
| Multiple chained Effects | Flatten into one event handler |
| Notifying parent of state change | Update both in same handler or lift state |
| POST on user action | Event handler |
| Subscription to browser/external store | `useSyncExternalStore` |
| Data fetching | Effect + `ignore` cleanup flag |
