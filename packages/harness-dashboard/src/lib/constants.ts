/** Dashboard constants — NO MOCK DATA */

export const NAV_ITEMS = [
  { label: "Overview", href: "/", icon: "grid" },
  { label: "Growth", href: "/growth", icon: "trending-up" },
  { label: "Mentions", href: "/mentions", icon: "radio" },
  { label: "Agents", href: "/agents", icon: "cpu" },
  { label: "Issues", href: "/issues", icon: "alert-circle" },
  { label: "Competitors", href: "/competitors", icon: "target" },
  { label: "Deploy", href: "/deploy", icon: "rocket" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const;
