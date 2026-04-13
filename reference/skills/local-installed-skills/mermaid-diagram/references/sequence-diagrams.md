# Sequence Diagram Reference

## Declaration

```mermaid
sequenceDiagram
```

## Participants

**Define participants (optional but controls order):**
```mermaid
sequenceDiagram
    participant A as Alice
    participant B as Bob
    actor U as User
```

- `participant` - Box shape
- `actor` - Stick figure shape

## Message Types

| Type | Syntax | Description |
|------|--------|-------------|
| Solid line | `->` | Synchronous |
| Dotted line | `-->` | Return |
| Solid arrow | `->>` | Async message |
| Dotted arrow | `-->>` | Async return |
| Cross | `-x` | Lost message |
| Dotted cross | `--x` | Lost async |
| Open arrow | `-)` | Async (open) |
| Dotted open | `--)` | Async return (open) |

## Activations

```mermaid
sequenceDiagram
    Alice->>+Bob: Request
    Bob-->>-Alice: Response
```

Or explicit:
```mermaid
sequenceDiagram
    Alice->>Bob: Request
    activate Bob
    Bob-->>Alice: Response
    deactivate Bob
```

**Nested activations:**
```mermaid
sequenceDiagram
    Alice->>+Bob: Request
    Bob->>+Charlie: Forward
    Charlie-->>-Bob: Reply
    Bob-->>-Alice: Response
```

## Notes

```mermaid
sequenceDiagram
    Note left of Alice: Note on left
    Note right of Bob: Note on right
    Note over Alice: Note over one
    Note over Alice,Bob: Note spanning
```

## Loops and Conditions

**Loop:**
```mermaid
sequenceDiagram
    loop Every minute
        Alice->>Bob: Ping
        Bob-->>Alice: Pong
    end
```

**Alt (if/else):**
```mermaid
sequenceDiagram
    alt Success
        Alice->>Bob: OK
    else Failure
        Alice->>Bob: Error
    end
```

**Opt (optional):**
```mermaid
sequenceDiagram
    opt Extra processing
        Alice->>Bob: Additional step
    end
```

**Par (parallel):**
```mermaid
sequenceDiagram
    par Alice to Bob
        Alice->>Bob: Message 1
    and Alice to Charlie
        Alice->>Charlie: Message 2
    end
```

**Critical (must complete):**
```mermaid
sequenceDiagram
    critical Establish connection
        Alice->>Bob: Connect
    option Network timeout
        Alice->>Alice: Retry
    end
```

**Break (exit early):**
```mermaid
sequenceDiagram
    break When error occurs
        Alice->>Bob: Error notification
    end
```

## Background Highlighting

```mermaid
sequenceDiagram
    rect rgb(200, 220, 255)
        Alice->>Bob: Highlighted section
        Bob-->>Alice: Response
    end
```

## Sequence Numbers

```mermaid
sequenceDiagram
    autonumber
    Alice->>Bob: First
    Bob->>Charlie: Second
    Charlie-->>Alice: Third
```

## Complete Example

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend
    participant API
    participant DB as Database

    User->>+Frontend: Submit Form
    Frontend->>Frontend: Validate

    alt Valid Input
        Frontend->>+API: POST /data
        API->>+DB: INSERT
        DB-->>-API: Success
        API-->>-Frontend: 201 Created
        Frontend-->>User: Success Message
    else Invalid Input
        Frontend-->>User: Validation Error
    end

    deactivate Frontend

    Note over User,DB: Transaction complete
```
