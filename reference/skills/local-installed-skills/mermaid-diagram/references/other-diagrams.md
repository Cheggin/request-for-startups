# Other Diagram Types Reference

## Pie Chart

```mermaid
pie showData
    title Browser Market Share
    "Chrome" : 65
    "Safari" : 19
    "Firefox" : 10
    "Edge" : 4
    "Other" : 2
```

- `showData` - Optional, shows values on chart
- Values can be percentages or raw numbers (auto-calculated)

## User Journey

```mermaid
journey
    title User Checkout Flow
    section Browse
        Visit site: 5: Customer
        Search products: 4: Customer
        View product: 5: Customer
    section Purchase
        Add to cart: 5: Customer
        Enter shipping: 3: Customer
        Payment: 2: Customer, System
        Confirmation: 5: Customer, System
```

- Score: 1-5 (satisfaction level)
- Actors listed after score

## Mindmap

```mermaid
mindmap
    root((Project))
        Planning
            Requirements
            Timeline
            Budget
        Development
            Frontend
                React
                CSS
            Backend
                API
                Database
        Testing
            Unit
            Integration
            E2E
```

**Node shapes:**
- `root` - Default
- `root((text))` - Circle
- `root)text(` - Bang
- `root[text]` - Square
- `root(text)` - Rounded

## Timeline

```mermaid
timeline
    title Company History
    section 2020
        Q1 : Founded : Seed funding
        Q3 : MVP Launch
    section 2021
        Q1 : Series A
        Q2 : 10 employees
        Q4 : Product-market fit
    section 2022
        Q1 : Series B
        Q3 : International expansion
```

## Git Graph

```mermaid
gitGraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Feature 1"
    commit id: "Feature 2"
    checkout main
    merge develop id: "Release 1.0" tag: "v1.0"
    branch hotfix
    checkout hotfix
    commit id: "Fix bug"
    checkout main
    merge hotfix id: "Hotfix" tag: "v1.0.1"
    checkout develop
    commit id: "Feature 3"
    checkout main
    merge develop id: "Release 2.0" tag: "v2.0"
```

**Commands:**
- `commit` - Add commit
- `branch <name>` - Create branch
- `checkout <name>` - Switch branch
- `merge <name>` - Merge branch
- `cherry-pick id: "x"` - Cherry pick

**Options:**
- `id: "text"` - Commit message
- `tag: "v1.0"` - Add tag
- `type: HIGHLIGHT` - Highlight commit

## Quadrant Chart

```mermaid
quadrantChart
    title Product Prioritization
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Do First
    quadrant-2 Plan
    quadrant-3 Delegate
    quadrant-4 Eliminate
    Feature A: [0.8, 0.9]
    Feature B: [0.2, 0.8]
    Feature C: [0.7, 0.3]
    Feature D: [0.3, 0.2]
```

## XY Chart

```mermaid
xychart-beta
    title "Sales Performance"
    x-axis [Jan, Feb, Mar, Apr, May]
    y-axis "Revenue (K)" 0 --> 100
    bar [30, 45, 60, 55, 70]
    line [25, 40, 55, 50, 65]
```

## Sankey Diagram

```mermaid
sankey-beta
    Source1,Target1,10
    Source1,Target2,20
    Source2,Target1,15
    Source2,Target3,25
    Target1,Final,25
    Target2,Final,20
    Target3,Final,25
```

## Block Diagram

```mermaid
block-beta
    columns 3

    block:group1:2
        A["Service A"]
        B["Service B"]
    end
    C["Gateway"]:1

    D["Database"]:3

    A --> C
    B --> C
    C --> D
```

## C4 Diagram

```mermaid
C4Context
    title System Context for Banking

    Person(customer, "Customer", "A bank customer")
    System(banking, "Banking System", "Core banking platform")
    System_Ext(email, "Email System", "Sendgrid")

    Rel(customer, banking, "Uses", "HTTPS")
    Rel(banking, email, "Sends emails", "SMTP")
```

**Diagram types:**
- `C4Context` - Context diagram
- `C4Container` - Container diagram
- `C4Component` - Component diagram
- `C4Dynamic` - Dynamic diagram

## Architecture Diagram

```mermaid
architecture-beta
    group api(cloud)[API]

    service db(database)[Database] in api
    service server(server)[Server] in api
    service disk(disk)[Storage] in api

    db:L -- R:server
    server:T -- B:disk
```

## Kanban

```mermaid
kanban
    Todo
        task1[Design mockups]
        task2[Write specs]
    In Progress
        task3[Implement API]
    Review
        task4[Code review]
    Done
        task5[Deploy v1]
```
