# MSBT Updates & Bug Fixes

## Recent UI/UX Improvements
- **Fully Responsive Modals:** Resolved an issue where modals had double scrollbars and scrolling was locked on mobile devices.
- **Improved Filter Rows:** Replaced `overflow-x-auto` with `flex-wrap` to prevent nested dropdown components from getting clipped off-screen when opened.
- **Payment Modes Formatting:** Updated payment mode selector buttons to use `min-h-10` instead of a fixed `h-10`, allowing the buttons to grow vertically and prevent text overlap on small screens.
- **Custom Dropdown Menus:** Replaced all native OS `<select>` HTML tags globally with a custom `framer-motion` styled `Select` component.
  - Native selects were forcing desktop browser dimensions which looked broken on simulated mobile views and resulted in text overlap.
  - The new component gracefully limits width to its container, truncates long text values, and renders a visually beautiful overlay for selecting options.
