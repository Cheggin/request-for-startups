# Dashboard Redesign Plan

## Problems
1. Overview is 4 generic metric cards + chart + 2 lists — no command authority
2. Footer agent panel duplicates /agents page — wasted space + confusion
3. Every page = same layout (heading + table) — visual monotony
4. Typography has no drama — everything text-base/text-sm
5. Information repeats across overview, agent panel, and agents page
6. Empty states are dead ends
7. Sidebar is flat list of 9 items — no grouping

## Design Decisions

### Kill the footer agent panel
- Redundant with /agents page
- Wastes 200px of vertical space on every page
- Move agent health summary into Overview instead

### Overview = dense status wall
- **Top row**: 3 health indicators (Agents, Issues, Deploys) — not metric cards, health signals
- **Hero**: Traffic chart (taller, full width, period label)
- **Below chart**: 2-column — Active agents feed | Critical issues
- **Bottom**: Startups as compact inline list
- Everything visible without scrolling on a 1080p screen

### Sidebar grouping
- **Monitor**: Overview, Agents, Issues
- **Grow**: Growth, Mentions, Competitors
- **Ship**: Deploy, Loops
- **System**: Settings

### Typography overhaul
- Bricolage Grotesque for large metric values (numbers are headlines)
- text-3xl for hero numbers
- text-sm as default body (not text-base)
- Stronger contrast between levels

### Page identity
- Agents: card grid with live status (port agent panel's categorization logic)
- Issues: severity triage board (already decent)
- Growth: chart-dominant with sparkline row
- Deploy: timeline, not table

## Implementation Order
1. Layout + sidebar restructure (remove agent panel)
2. Overview complete rewrite
3. Agents page with categorization
4. Typography + spacing pass on all pages
5. Polish pass
