---
name: react-hook-form
description: Guidelines, gotchas, and best practices for React Hook Form integration, form validation, formState Proxy subscriptions, and custom input components in React 19 / Next.js. Triggers on form validation, react-hook-form, useForm, useFormContext, useFormState, or form debugging.
---

# React Hook Form Skill

Guidelines and critical patterns to prevent common React Hook Form bugs and ensure responsive `onChange` validation.

## 1. Always Attach `onSubmit={handleSubmit(...)}` to `<form>`
Never omit `onSubmit` from the `<form>` element. Without `handleSubmit`, clicking a `type="submit"` button triggers standard browser submission and bypasses `react-hook-form`'s schema validation engine.

```tsx
// ❌ WRONG: handleSubmit is missing from form tag
<form className="...">

// ✅ CORRECT: Attach handleSubmit to form onSubmit
<form onSubmit={formActions.handleSubmit(onSubmit)} className="...">
```

## 2. Component Subscriptions via `useFormState`
`react-hook-form` wraps `formState` in a JavaScript `Proxy` for render optimization. 
Accessing `formState` via optional chaining (e.g. `formContext?.formState?.errors`) without destructuring or subscribing skips the Proxy `get` trap, preventing the component from re-rendering when validation errors update on `onChange`.

In custom child inputs inside `<FormProvider>`, always use `useFormState({ control })`:

```tsx
// ❌ WRONG: Optional chaining skips Proxy subscription; component will not re-render on errors
const formContext = useFormContext();
const formError = formContext?.formState?.errors[name]?.message;

// ✅ CORRECT: useFormState explicitly registers a subscription to form errors
const formContext = useFormContext();
const { errors } = useFormState({ control: formContext?.control });
const formError = errors?.[name]?.message;
```

## 3. Prop Spreading Order (`{...props}` vs `{...registerProps}`)
When forwarding props to custom input elements, always spread `{...props}` **before** `{...registerProps}`.

```tsx
// ❌ WRONG: {...props} overwrites registerProps.ref with undefined
<Input {...registerProps} {...props} />

// ✅ CORRECT: registerProps.ref remains intact
<Input {...props} {...registerProps} />
```

If `{...props}` comes second, an unpassed `ref?: React.Ref<HTMLInputElement>` in `props` will evaluate to `undefined` and erase `registerProps.ref`, breaking DOM element reference binding in `react-hook-form`.

## 4. Avoid Native Event Object Mutation
Do not mutate `e.target.value` inside custom `onChange` wrappers prior to delegating to `registerProps.onChange`. Direct event target mutation breaks React Hook Form's internal value synchronization.

```tsx
// ❌ WRONG: Mutating event target breaks RHF value tracking
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  e.target.value = normalize(e.target.value);
  onChange?.(e);
};

// ✅ CORRECT: Let RHF handle native change events directly
<input {...registerProps} />
```

## 5. Prefer `z.enum()` over Deprecated `z.nativeEnum()`
In Zod 3.24+ / Zod 4, `z.nativeEnum()` for `as const` object dictionaries is deprecated in favor of `z.enum()`.

```tsx
// ❌ DEPRECATED: z.nativeEnum on as const objects
const AUTH_FORMS = { SIGN_IN: "SIGN_IN" } as const;
authFrom: z.nativeEnum(AUTH_FORMS)

// ✅ CORRECT: Use z.enum directly
authFrom: z.enum(AUTH_FORMS)
```
