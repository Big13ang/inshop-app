# Code Examples

Full before/after code for every pattern in [SKILL.md](../SKILL.md). Numbers match the rule numbers there. Source: [react.dev/learn/you-might-not-need-an-effect](https://react.dev/learn/you-might-not-need-an-effect).

---

## 1. Derived state in an Effect

```tsx
// ❌ Two render passes, stale intermediate state
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(firstName + ' ' + lastName);
}, [firstName, lastName]);

// ✅ Calculate at render time
const fullName = firstName + ' ' + lastName;
```

---

## 2. Caching an expensive calculation

The article's fix here is `useMemo`. **This project runs React Compiler, which memoizes expensive calculations for you** — so the fix is even simpler: just calculate the value inline, with no Effect, no state, and no manual `useMemo`.

```tsx
// ❌ State + Effect just to hold a derived value
const [visibleTodos, setVisibleTodos] = useState([]);
useEffect(() => {
  setVisibleTodos(getFilteredTodos(todos, filter));
}, [todos, filter]);

// ✅ Calculate at render time — React Compiler memoizes the expensive call automatically
const visibleTodos = getFilteredTodos(todos, filter);
```

---

## 3. State reset when a prop changes

```tsx
// ❌ Children render once with stale state, then again after the Effect
useEffect(() => {
  setComment('');
}, [userId]);

// ✅ Tell React this is a different component instance
<Profile key={userId} userId={userId} />
// Profile's state resets automatically when key changes
```

---

## 4. Adjusting *some* state when a prop changes

```tsx
// ❌ Extra render with stale selection
useEffect(() => {
  setSelection(null);
}, [items]);

// ✅ Option A (best): store only the ID, derive selection during render
const selection = items.find(item => item.id === selectedId) ?? null;

// ✅ Option B: update state during render (unusual but valid — only when Option A doesn't fit)
const [prevItems, setPrevItems] = useState(items);
if (items !== prevItems) {
  setPrevItems(items);
  setSelection(null);
}
```

---

## 5. Sharing logic between event handlers

```tsx
// ❌ Fires on mount/refresh if product.isInCart is already true —
// an Effect runs because the component was *displayed*, not because of a click
useEffect(() => {
  if (product.isInCart) {
    showNotification(`Added ${product.name} to the shopping cart!`);
  }
}, [product]);

// ✅ Extract the shared behavior into a plain function, call it from every handler that needs it
function buyProduct() {
  addToCart(product);
  showNotification(`Added ${product.name} to the shopping cart!`);
}

function handleBuyClick() {
  buyProduct();
}

function handleCheckoutClick() {
  buyProduct();
  navigateTo('/checkout');
}
```

---

## 6. POST requests

```tsx
// ❌ Analytics vs form submission look the same but are different —
// this one is user-triggered and shouldn't be hidden behind an Effect + extra state
const [jsonToSubmit, setJsonToSubmit] = useState(null);
useEffect(() => {
  if (jsonToSubmit !== null) {
    post('/api/register', jsonToSubmit);
  }
}, [jsonToSubmit]);

function handleSubmit(e) {
  e.preventDefault();
  setJsonToSubmit({ firstName, lastName });
}

// ✅ Analytics (runs because the component appeared) → Effect is correct
useEffect(() => {
  post('/analytics/event', { eventName: 'visit_form' });
}, []);

// ✅ Form submission (user triggered) → straight to an event handler
function handleSubmit(e) {
  e.preventDefault();
  post('/api/register', { firstName, lastName });
}
```

---

## 7. Chains of Effects

```tsx
// ❌ Each setX triggers another Effect → cascading re-renders, hard to follow
useEffect(() => {
  if (card !== null && card.gold) {
    setGoldCardCount(c => c + 1);
  }
}, [card]);

useEffect(() => {
  if (goldCardCount > 3) {
    setRound(r => r + 1);
    setGoldCardCount(0);
  }
}, [goldCardCount]);

useEffect(() => {
  if (round > 5) {
    setIsGameOver(true);
  }
}, [round]);

// ✅ Compute everything in the event handler in one pass; derive isGameOver at render time
const isGameOver = round > 5;

function handlePlaceCard(nextCard) {
  if (isGameOver) throw Error('Game already ended.');

  setCard(nextCard);
  if (nextCard.gold) {
    if (goldCardCount < 3) {
      setGoldCardCount(goldCardCount + 1);
    } else {
      setGoldCardCount(0);
      setRound(round + 1);
    }
  }
}
```

---

## 8. App initialization

```tsx
// ❌ Runs twice in Strict Mode dev, and on every remount
useEffect(() => {
  loadDataFromLocalStorage();
  checkAuthToken();
}, []);

// ✅ Option A: a module-level guard, if the logic needs to live inside the component
let didInit = false;

function App() {
  useEffect(() => {
    if (!didInit) {
      didInit = true;
      loadDataFromLocalStorage();
      checkAuthToken();
    }
  }, []);
}

// ✅ Option B (preferred when possible): run at module load, before React renders at all
if (typeof window !== 'undefined') {
  checkAuthToken();
  loadDataFromLocalStorage();
}

function App() { /* ... */ }
```

---

## 9. Notifying a parent component

```tsx
// ❌ Parent re-renders one tick after the child already re-rendered
useEffect(() => {
  onChange(isOn);
}, [isOn, onChange]);

// ✅ Update both in the same handler that changes the state
function updateToggle(nextIsOn) {
  setIsOn(nextIsOn);
  onChange(nextIsOn);
}

function handleClick() {
  updateToggle(!isOn);
}

// ✅✅ Or skip local state entirely and make the component fully controlled
function Toggle({ isOn, onChange }) {
  return <button onClick={() => onChange(!isOn)}>{isOn ? 'On' : 'Off'}</button>;
}
```

---

## 10. Passing data up to the parent

```tsx
// ❌ Child fetches, then uses an Effect just to hand the result to the parent —
// an extra render round-trip for no reason
function Child({ onFetched }) {
  const data = useSomeAPI();
  useEffect(() => {
    if (data) {
      onFetched(data);
    }
  }, [onFetched, data]);
}

// ✅ Let the parent own the fetch and pass data down as a prop
function Parent() {
  const data = useSomeAPI();
  return <Child data={data} />;
}

function Child({ data }) {
  // ...
}
```

---

## 11. External store subscriptions

```tsx
// ❌ Effect-based subscription (works but fragile — no consistent snapshot during concurrent rendering)
useEffect(() => {
  function updateState() {
    setIsOnline(navigator.onLine);
  }
  updateState();
  window.addEventListener('online', updateState);
  window.addEventListener('offline', updateState);
  return () => {
    window.removeEventListener('online', updateState);
    window.removeEventListener('offline', updateState);
  };
}, []);

// ✅ useSyncExternalStore
function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function useOnlineStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true, // server snapshot
  );
}
```

---

## 12. Data fetching (an Effect IS correct here — add cleanup)

```tsx
// ❌ No protection against race conditions — a slow response for an old query can overwrite a newer one
useEffect(() => {
  fetchResults(query, page).then(json => {
    setResults(json);
  });
}, [query, page]);

// ✅ Add an `ignore` cleanup flag
useEffect(() => {
  let ignore = false;

  fetchResults(query, page).then(json => {
    if (!ignore) setResults(json);
  });

  return () => { ignore = true; };
}, [query, page]);

// ✅✅ Best: extract the repeated pattern into a custom hook
function useData(url) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let ignore = false;
    fetch(url)
      .then(response => response.json())
      .then(json => {
        if (!ignore) setData(json);
      });
    return () => { ignore = true; };
  }, [url]);
  return data;
}
```
