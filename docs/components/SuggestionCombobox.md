# SuggestionCombobox — How‑To Guide

A reusable, accessible combobox component for rendering search suggestions with keyboard navigation and type grouping. It is UI‑only and agnostic of data source. Pair it with a feature hook (e.g., `useSuggestions`) to fetch server data.

- Location: `src/components/ui/forms/SuggestionCombobox.tsx`
- Status: Production‑ready (WCAG 2.1 AA intent)
- Dependencies: existing design system `Input`, Tailwind classes

## When To Use

- Known‑item search with auto‑complete (e.g., products by name/SKU)
- Exploratory search with multiple sources (content, customers, tags)
- Any feature that needs a11y‑compliant suggestions with keyboard support

## Key Features

- A11y combobox pattern (ARIA roles/attributes) with Up/Down/Enter/Esc keys
- Debounce handled by caller; component renders what you pass in
- Optional type grouping with section headers (Recent, Products, Content, Customers, Tags)
- Match highlighting (via `highlightQuery` or current value)
- Pure UI: controlled `value`, `onChange`, `onSelect`, `suggestions`, `loading`

## Props

```
value: string                    // controlled input value
onChange: (v: string) => void    // update input value
onSelect?: (item: SuggestionItem) => void // fires when user selects a suggestion
suggestions: SuggestionItem[]    // items to show (text, type?, subtype?, metadata?)
loading?: boolean                // show 'Loading…' state
placeholder?: string             // input placeholder (default: 'Search…')
label?: string                   // visible label (default: 'Search')
id?: string                      // base id used for ARIA attributes
minChars?: number                // min chars before list opens (default: 2)
highlightQuery?: string          // explicit query to highlight; fallback to `value`
groupByType?: boolean            // show grouped headers by item.type (default: true)
className?: string               // container styles
inputProps?: InputProps          // forwarded to inner Input (except value/onChange/id)
```

`SuggestionItem` shape:
```
{
  text: string,
  type?: string,        // e.g., 'product' | 'content' | 'customer' | 'tag' | 'recent'
  subtype?: string,
  metadata?: Record<string, unknown>
}
```

## Minimal Usage

```tsx
import SuggestionCombobox from '@/components/ui/forms/SuggestionCombobox';
import { useSuggestions } from '@/features/search/hooks/useSuggestions';
import { useState } from 'react';

function MySearch() {
  const [value, setValue] = useState('');
  const { data = [], isFetching } = useSuggestions(value, { type: 'all', limit: 7 });

  return (
    <SuggestionCombobox
      id="global-search"
      value={value}
      onChange={setValue}
      onSelect={(item) => setValue(item.text)}
      suggestions={data}
      loading={isFetching}
      placeholder="Search..."
      label="Search"
      minChars={2}
      groupByType
    />
  );
}
```

## With Product Search Modes (Known vs Exploratory)

```tsx
const [mode, setMode] = useState<'known' | 'exploratory'>('known');
const { data = [], isFetching } = useSuggestions(value, {
  type: mode === 'known' ? 'products' : 'all',
  limit: 7,
});

<SuggestionCombobox
  id="product-search"
  value={value}
  onChange={(v) => {
    setValue(v);
    track('product_search_applied', { length: v.length }, 'medium');
  }}
  onSelect={(item) => {
    setValue(item.text);
    track('product_search_suggestion_selected', { suggestion: item.text, type: item.type, mode }, 'medium');
  }}
  suggestions={data}
  loading={isFetching}
  placeholder="Search products..."
  label="Search"
/>
```

## Pairing With Feature Hook (CORE Compliant)

Use `useSuggestions` from `src/features/search/hooks/useSuggestions.ts` to keep server state in React Query and follow centralized query keys in `src/features/search/keys.ts`.

```tsx
const { data = [], isFetching } = useSuggestions(query, { type: 'products', limit: 7 });
```

- No server state in Zustand; only UI flags live in components/stores
- No manual envelopes; `useApiClient` handles auth and error normalization
- Reusable across domains (content/customers/tags)

## Accessibility

- Roles/attributes: `combobox`, `listbox`, `option`, `aria-activedescendant`, `aria-expanded`, `aria-controls`
- Keyboard: Up/Down navigates items, Enter selects, Esc closes
- Screen reader friendly section headers when `groupByType` is on

## Performance & UX

- Debounce in caller (e.g., 250ms) to reduce network chatter
- `staleTime` ~15s on suggestions to reuse results during quick edits
- Use `minChars` ≥ 2 to avoid noisy queries

## Testing Tips

- Unit: assert ARIA roles present and keyboard moves active option
- Integration: mock the `useSuggestions` hook to feed suggestions
- a11y: check focus/selection behavior, ensure `aria-activedescendant` updates

## Common Pitfalls

- Do not fetch inside the component (kept UI‑only by design)
- Ensure `id` is unique per instance to avoid ARIA collisions
- Pass stable arrays for `suggestions` to prevent re‑mount flicker

---

## Examples In Codebase

- Product list filters: `src/components/products/ProductList.tsx`
- Feature hook: `src/features/search/hooks/useSuggestions.ts`

