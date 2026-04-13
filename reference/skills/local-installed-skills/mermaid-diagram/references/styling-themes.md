# Styling and Themes Reference

## Themes

**Available themes:**
- `default` - Standard theme
- `neutral` - Black and white, print-friendly
- `dark` - Dark mode
- `forest` - Green tones
- `base` - Customizable base theme

**Apply theme via frontmatter:**
```mermaid
---
config:
    theme: forest
---
flowchart LR
    A --> B
```

**Apply theme via directive:**
```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart LR
    A --> B
```

## Theme Variables

Only `base` theme supports customization:

```mermaid
%%{init: {
    'theme': 'base',
    'themeVariables': {
        'primaryColor': '#ff6b6b',
        'primaryTextColor': '#fff',
        'primaryBorderColor': '#ff5252',
        'lineColor': '#666',
        'secondaryColor': '#4ecdc4',
        'tertiaryColor': '#f7fff7'
    }
}}%%
flowchart LR
    A --> B --> C
```

**Common theme variables:**
| Variable | Description |
|----------|-------------|
| `primaryColor` | Main node background |
| `primaryTextColor` | Main node text |
| `primaryBorderColor` | Main node border |
| `secondaryColor` | Secondary elements |
| `tertiaryColor` | Tertiary elements |
| `lineColor` | Connector lines |
| `textColor` | General text |
| `mainBkg` | Background color |
| `nodeBorder` | Node border color |
| `clusterBkg` | Subgraph background |
| `clusterBorder` | Subgraph border |

## Class Definitions (classDef)

**Define and apply:**
```mermaid
flowchart LR
    classDef primary fill:#4a90d9,stroke:#2e5a87,color:#fff
    classDef danger fill:#ff6b6b,stroke:#ff5252,color:#fff
    classDef success fill:#51cf66,stroke:#37b24d,color:#fff

    A[Start]:::primary --> B{Check}
    B -->|OK| C[Success]:::success
    B -->|Fail| D[Error]:::danger
```

**Apply to multiple nodes:**
```mermaid
flowchart LR
    classDef highlight fill:#ffd43b,stroke:#fab005

    A --> B --> C --> D
    class A,C highlight
```

**Default class:**
```mermaid
flowchart LR
    classDef default fill:#f8f9fa,stroke:#dee2e6
    A --> B --> C
```

## Style Properties

| Property | Example | Description |
|----------|---------|-------------|
| `fill` | `#ff0000` | Background color |
| `stroke` | `#333` | Border color |
| `stroke-width` | `2px` | Border width |
| `color` | `#fff` | Text color |
| `stroke-dasharray` | `5 5` | Dashed border |
| `opacity` | `0.5` | Transparency |
| `rx` | `10` | Border radius (x) |
| `ry` | `10` | Border radius (y) |

## Inline Styles

```mermaid
flowchart LR
    A --> B
    style A fill:#ff0,stroke:#333,stroke-width:4px
    style B fill:#f9f,stroke:#333,stroke-width:2px
```

## Link Styles

```mermaid
flowchart LR
    A --> B --> C --> D

    linkStyle 0 stroke:#ff0000,stroke-width:2px
    linkStyle 1 stroke:#00ff00,stroke-width:3px
    linkStyle 2 stroke:#0000ff,stroke-width:4px,stroke-dasharray:5 5
```

**Style all links:**
```mermaid
flowchart LR
    linkStyle default stroke:#999,stroke-width:2px
```

## Subgraph Styling

```mermaid
flowchart TB
    subgraph sub1 [Group A]
        A --> B
    end
    subgraph sub2 [Group B]
        C --> D
    end

    style sub1 fill:#e3f2fd,stroke:#1976d2
    style sub2 fill:#fff3e0,stroke:#f57c00
```

## Look Customization

**Neo (modern) look:**
```mermaid
%%{init: {'look': 'neo'}}%%
flowchart LR
    A --> B --> C
```

**Hand-drawn look:**
```mermaid
%%{init: {'look': 'handDrawn'}}%%
flowchart LR
    A --> B --> C
```

**Classic look:**
```mermaid
%%{init: {'look': 'classic'}}%%
flowchart LR
    A --> B --> C
```

## Layout Algorithm

**ELK (better for complex diagrams):**
```mermaid
%%{init: {'flowchart': {'defaultRenderer': 'elk'}}}%%
flowchart TB
    A --> B --> C --> D
```

## Font Customization

```mermaid
%%{init: {
    'themeVariables': {
        'fontFamily': 'arial',
        'fontSize': '16px'
    }
}}%%
flowchart LR
    A --> B
```

## Complete Styled Example

```mermaid
%%{init: {
    'theme': 'base',
    'themeVariables': {
        'primaryColor': '#6366f1',
        'primaryTextColor': '#ffffff',
        'primaryBorderColor': '#4f46e5',
        'lineColor': '#6b7280',
        'secondaryColor': '#a78bfa',
        'tertiaryColor': '#f3f4f6',
        'clusterBkg': '#f8fafc',
        'clusterBorder': '#e2e8f0'
    }
}}%%
flowchart TB
    classDef input fill:#10b981,stroke:#059669,color:#fff
    classDef process fill:#6366f1,stroke:#4f46e5,color:#fff
    classDef output fill:#f59e0b,stroke:#d97706,color:#fff
    classDef error fill:#ef4444,stroke:#dc2626,color:#fff

    subgraph Input Layer
        A[User Input]:::input
        B[API Request]:::input
    end

    subgraph Processing
        C{Validate}:::process
        D[Transform]:::process
        E[Compute]:::process
    end

    subgraph Output Layer
        F[Response]:::output
        G[Error]:::error
    end

    A --> C
    B --> C
    C -->|Valid| D
    C -->|Invalid| G
    D --> E
    E --> F

    linkStyle 2 stroke:#10b981,stroke-width:2px
    linkStyle 3 stroke:#ef4444,stroke-width:2px,stroke-dasharray:5 5
```
