

# Fix: Restore Today page and default to Command Center

The previous change replaced the `Index` component at `/` with `CommandCenter`, breaking the Today page. The fix:

1. **`src/App.tsx`**: Restore `<Route path="/" element={<CommandCenter />} />` but also add a dedicated `/today` route for the Today/Index page: `<Route path="/today" element={<Index />} />`

2. **`src/components/layout/AppSidebar.tsx`**: Update the Today nav item URL from `/` to `/today`

This keeps Command Center as the default landing page while preserving the Today page at `/today`.

