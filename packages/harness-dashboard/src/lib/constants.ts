/** Dashboard constants — NO MOCK DATA */

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Monitor",
    items: [
      { label: "Overview", href: "/", icon: "grid" },
      { label: "Agents", href: "/agents", icon: "cpu" },
      { label: "Issues", href: "/issues", icon: "alert-circle" },
    ],
  },
  {
    label: "Grow",
    items: [
      { label: "Growth", href: "/growth", icon: "trending-up" },
      { label: "Mentions", href: "/mentions", icon: "radio" },
      { label: "Competitors", href: "/competitors", icon: "target" },
    ],
  },
  {
    label: "Ship",
    items: [
      { label: "Deploy", href: "/deploy", icon: "rocket" },
      { label: "Loops", href: "/loops", icon: "repeat" },
    ],
  },
];

export const SETTINGS_NAV: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: "settings",
};

/** Flat list for backwards compat */
export const NAV_ITEMS = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  SETTINGS_NAV,
] as const;

/** Platform short labels for mention tables */
export const PLATFORM_LABELS_SHORT: Record<string, string> = {
  hn: "HN",
  reddit: "Reddit",
  twitter: "X",
  linkedin: "LI",
};

/** Platform full labels for mention summaries */
export const PLATFORM_LABELS_FULL: Record<string, string> = {
  hn: "Hacker News",
  reddit: "Reddit",
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
};
