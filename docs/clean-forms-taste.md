# Clean Forms Architecture (Code Taste)

Standard pattern for forms established in `/app/app/profile/edit` (`features/profile/edit`).

## 1. File Structure Blueprint

```
features/<feature>/<subfeature>/
├── <Feature>View.tsx            # Orchestrator only (FormProvider, useForm, layout, onSubmit)
├── <feature>Schema.ts           # Zod schema + infer type + pure defaultValues mapper
├── components/
│   ├── FormSection.tsx          # Compound UI primitives (Root, Title, Field)
│   ├── <Slice>Section.tsx       # Domain field groups (useFormContext)
│   └── <Feature>Footer.tsx      # Sticky footer detached via HTML5 form="<id>"
└── hooks/
    └── use<AsyncCheck>.ts       # Debounced queries & async validation
```

---

## 2. Core Principles (Single Responsibility)

1. **Orchestrator Does NOT Render Fields**:
   - `<Feature>View` initializes `useForm` with `zodResolver` (`mode: 'onChange'`).
   - Wraps content in `<FormProvider>`. Renders layout, header, sections, and footer. Never inlines raw input fields.
2. **Domain Sections via `useFormContext`**:
   - Each section (`ShopSection`, `BioSection`, etc.) consumes `useFormContext<SchemaType>()`.
   - Zero prop drilling. Each section manages only its logical field group.
3. **Compound Layout Primitives (`FormSection`)**:
   - `FormSection.Root`: visual card container (`bg-surface rounded-2xl p-4`).
   - `FormSection.Title`: icon + section heading with border separator.
   - `FormSection.Field`: label with `htmlFor`, required indicator, and reserved error slot (`min-h-[16px]`) to prevent layout shifts (CLS).
4. **Detached Sticky Footer via HTML5 `form`**:
   - Form has `<form id={FORM_ID}>`.
   - Sticky footer stays outside scrollable `<main>` and triggers submit remotely:
     ```tsx
     <Button type="submit" form={FORM_ID} disabled={isSaving}>ذخیره</Button>
     ```
5. **Derived State Over `useEffect`**:
   - Never use `useState`/`useEffect` for character counts or derived flags.
   - Use `useWatch({ control, name })` and derive values directly (e.g. `bio?.length || 0`).
6. **Encapsulated Async Checks**:
   - Debounced API queries (e.g. username availability) live in dedicated hooks, running client-side `schema.safeParse` before hitting the network.
7. **BiDi & Micro-UX**:
   - Page container defaults to `dir="rtl"`.
   - Explicitly set `dir="ltr"` and `font-mono` on technical fields (usernames `@handle`, phone numbers).

---

## 3. Quick Checklist

- [ ] View only orchestrates; zero inline inputs.
- [ ] Zod schema + inferred type defined in `<feature>Schema.ts`.
- [ ] Pure `generateDefaultValues(entity)` function maps server data to form state.
- [ ] Child sections consume `useFormContext`.
- [ ] Error slots pre-allocated (`min-h-[16px]`) to avoid CLS.
- [ ] Footer detached from scroll area and uses `form={FORM_ID}`.
- [ ] Live values use `useWatch` without `useEffect`.
