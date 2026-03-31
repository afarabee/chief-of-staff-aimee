

# Improve Toast Notifications: Duration, Clickability, Dismissibility

## Problems
1. Toasts stay too long (`TOAST_REMOVE_DELAY = 1000000` ms ≈ 16 minutes)
2. No way to click a toast to navigate to the item it references
3. Close button is tiny and hard to tap on mobile

## Changes

### 1. `src/hooks/use-toast.ts` — Shorter duration
- Change `TOAST_REMOVE_DELAY` from `1000000` to `3000` (3 seconds)
- Add optional `onClick` callback to `ToasterToast` type so toasts can carry navigation behavior

### 2. `src/components/ui/toaster.tsx` — Clickable toasts + better dismiss
- Wrap toast content in a clickable div that calls `toast.onClick?.()` and then dismisses
- Add `cursor-pointer` when `onClick` is present
- Replace the small `ToastClose` X button with a larger, always-visible dismiss button (bigger tap target, always visible — not just on hover)

### 3. `src/components/ui/toast.tsx` — Close button styling
- Make close button always visible (`opacity-100` instead of `opacity-0 group-hover:opacity-100`)
- Increase tap target size: `p-2` instead of `p-1`, icon `h-5 w-5` instead of `h-4 w-4`

### 4. Key hook files — Add navigation on click
Update toast calls in the most common CRUD hooks to include an `onClick` that navigates to the created/updated item using `window.location`:

- **`src/hooks/useTasks.ts`** — `useCreateTask` `onSuccess`: return created task from mutation, add `onClick` that navigates to `/tasks?edit={id}`
- **`src/hooks/useIdeas.ts`** — `useCreateIdea` `onSuccess`: navigate to `/ideas?edit={id}`
- **`src/hooks/useProviders.ts`** — `useCreateProvider` `onSuccess`: navigate to `/providers?edit={id}`
- **`src/hooks/useCategories.ts`** — `useCreateCategory` `onSuccess`: navigate to `/categories`
- **`src/hooks/useScheduleToCalendar.ts`** — `onSuccess`: open `htmlLink` in new tab

Navigation approach: use the existing `?edit=` deep-linking pattern already in the app, triggered via `window.location.href` or by importing a shared navigate helper.

## Files

| File | Change |
|------|--------|
| `src/hooks/use-toast.ts` | Reduce delay to 3s, add `onClick` to type |
| `src/components/ui/toast.tsx` | Bigger, always-visible close button |
| `src/components/ui/toaster.tsx` | Wire onClick + dismiss on click |
| `src/hooks/useTasks.ts` | Add onClick navigation to create toast |
| `src/hooks/useIdeas.ts` | Add onClick navigation to create toast |
| `src/hooks/useProviders.ts` | Add onClick navigation to create toast |
| `src/hooks/useScheduleToCalendar.ts` | Add onClick to open calendar link |

