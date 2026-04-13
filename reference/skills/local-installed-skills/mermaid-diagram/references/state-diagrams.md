# State Diagram Reference

## Declaration

```mermaid
stateDiagram-v2
```

Note: Use `stateDiagram-v2` for the newer, more feature-rich version.

## States

**Simple states:**
```mermaid
stateDiagram-v2
    StateA
    StateB
    state "State with spaces" as StateC
```

**Start and end:**
```mermaid
stateDiagram-v2
    [*] --> Active
    Active --> [*]
```

- `[*]` represents both start (when source) and end (when target)

## Transitions

**Basic:**
```mermaid
stateDiagram-v2
    StateA --> StateB
    StateB --> StateC : event
```

**With labels:**
```mermaid
stateDiagram-v2
    Idle --> Running : start()
    Running --> Paused : pause()
    Paused --> Running : resume()
    Running --> Idle : stop()
```

## Composite States

```mermaid
stateDiagram-v2
    [*] --> Active

    state Active {
        [*] --> Idle
        Idle --> Processing : work
        Processing --> Idle : done
    }

    Active --> Inactive : deactivate
```

**Nested composite states:**
```mermaid
stateDiagram-v2
    state Parent {
        state Child {
            [*] --> Grandchild
        }
    }
```

## Choice (Conditional)

```mermaid
stateDiagram-v2
    state decision <<choice>>
    [*] --> Checking
    Checking --> decision
    decision --> Valid : if valid
    decision --> Invalid : if invalid
```

## Fork and Join (Parallel)

```mermaid
stateDiagram-v2
    state fork_state <<fork>>
    state join_state <<join>>

    [*] --> fork_state
    fork_state --> TaskA
    fork_state --> TaskB
    TaskA --> join_state
    TaskB --> join_state
    join_state --> [*]
```

## Notes

```mermaid
stateDiagram-v2
    State1 : Description line 1
    State1 : Description line 2

    note right of State1
        Extended note
        with multiple lines
    end note

    note left of State2 : Short note
```

## Concurrency

```mermaid
stateDiagram-v2
    [*] --> Active

    state Active {
        [*] --> Working
        --
        [*] --> Monitoring
    }
```

The `--` separator creates concurrent regions.

## Direction

```mermaid
stateDiagram-v2
    direction LR
    [*] --> A --> B --> [*]
```

Directions: `LR`, `RL`, `TB`, `BT`

## Styling

```mermaid
stateDiagram-v2
    classDef error fill:#f00,color:#fff
    classDef success fill:#0f0,color:#000

    [*] --> Running
    Running --> Error:::error
    Running --> Complete:::success
```

## Complete Example

```mermaid
stateDiagram-v2
    [*] --> Idle

    state "Order Processing" as Processing {
        [*] --> Received

        state validation <<choice>>
        Received --> validation : validate
        validation --> Valid : passes
        validation --> Invalid : fails

        Valid --> Preparing
        Preparing --> Ready

        state fork_ship <<fork>>
        state join_ship <<join>>
        Ready --> fork_ship
        fork_ship --> Packing
        fork_ship --> Invoicing
        Packing --> join_ship
        Invoicing --> join_ship
        join_ship --> Shipped
    }

    Idle --> Processing : new order
    Processing --> Delivered : delivery confirmed
    Invalid --> Cancelled
    Delivered --> [*]
    Cancelled --> [*]

    note right of Processing
        Main order workflow
        with parallel shipping tasks
    end note

    classDef cancelled fill:#ffcccc,stroke:#ff0000
    Cancelled:::cancelled
```
