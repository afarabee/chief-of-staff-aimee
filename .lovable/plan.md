

# Add CFO App Link to Sidebar

## Changes

### `src/components/layout/AppSidebar.tsx`

- Import `DollarSign` and `ExternalLink` from lucide-react
- Import `openExternalUrl` from `@/lib/openExternalUrl`
- After the existing nav items loop, add a `SidebarSeparator` followed by a new `SidebarMenuItem` for "CFO Dashboard"
- Render it as a `<button>` (not `NavLink`) that calls `openExternalUrl('https://cfo-for-aimee.lovable.app')` on click
- Style it consistently with existing nav items, with a small `ExternalLink` icon (12px) next to the label to indicate it opens externally
- On mobile, also close the sidebar after clicking

### Files
| File | Change |
|------|--------|
| `src/components/layout/AppSidebar.tsx` | Add separated external CFO link at bottom of nav |

