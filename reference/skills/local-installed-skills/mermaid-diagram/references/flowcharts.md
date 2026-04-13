# Flowchart Reference

## Declaration

```mermaid
flowchart <direction>
```

**Directions:**
- `TB` / `TD` - Top to Bottom/Down
- `BT` - Bottom to Top
- `LR` - Left to Right
- `RL` - Right to Left

## Node Shapes

| Shape | Syntax | Use Case |
|-------|--------|----------|
| Rectangle | `[text]` | Process/action |
| Rounded | `(text)` | Start/end |
| Stadium | `([text])` | Terminal |
| Subroutine | `[[text]]` | Subroutine/module |
| Cylinder | `[(text)]` | Database |
| Circle | `((text))` | Connector |
| Asymmetric | `>text]` | Input/output |
| Rhombus | `{text}` | Decision |
| Hexagon | `{{text}}` | Preparation |
| Parallelogram | `[/text/]` | Input |
| Parallelogram Alt | `[\text\]` | Output |
| Trapezoid | `[/text\]` | Manual operation |
| Trapezoid Alt | `[\text/]` | Manual operation |
| Double Circle | `(((text)))` | Double circle |

## Link Types

| Type | Syntax | Description |
|------|--------|-------------|
| Arrow | `-->` | Solid arrow |
| Open | `---` | Solid line |
| Dotted | `-.-` | Dotted line |
| Dotted Arrow | `-.->` | Dotted arrow |
| Thick | `===` | Thick line |
| Thick Arrow | `==>` | Thick arrow |
| Invisible | `~~~` | No line (spacing) |

**With text:**
- `-- text -->` or `-->|text|`
- `-. text .->` or `-.->|text|`
- `== text ==>` or `==>|text|`

## Subgraphs

```mermaid
flowchart TB
    subgraph Group1 [Display Name]
        A --> B
    end
    subgraph Group2
        C --> D
    end
    Group1 --> Group2
```

**Subgraph direction:**
```mermaid
flowchart LR
    subgraph TOP
        direction TB
        A --> B
    end
```

## Styling

**Inline style:**
```mermaid
flowchart LR
    A:::className --> B
    classDef className fill:#f9f,stroke:#333,stroke-width:2px
```

**Class definitions:**
```mermaid
flowchart LR
    classDef default fill:#f9f,stroke:#333
    classDef error fill:#f00,color:#fff
    A:::error --> B
```

**Common style properties:**
- `fill` - Background color
- `stroke` - Border color
- `stroke-width` - Border width
- `color` - Text color
- `stroke-dasharray` - Dashed border (e.g., `5 5`)

## Complete Example

```mermaid
flowchart TD
    subgraph Input
        A[User Request] --> B{Valid?}
    end

    subgraph Processing
        B -->|Yes| C[Process Data]
        B -->|No| D[Show Error]
        C --> E[(Database)]
        E --> F[Generate Response]
    end

    subgraph Output
        F --> G([Return Result])
        D --> H([Return Error])
    end

    classDef error fill:#ffcccc,stroke:#ff0000
    D:::error
    H:::error
```
