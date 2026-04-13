# Gantt Chart Reference

## Declaration

```mermaid
gantt
```

## Configuration

```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    excludes weekends
    tickInterval 1week
```

**Date formats:**
- `YYYY-MM-DD` (default)
- `DD-MM-YYYY`
- `MM-DD-YYYY`
- `YYYY-MM-DD HH:mm`

**Axis format (display):**
```mermaid
gantt
    axisFormat %Y-%m-%d
    axisFormat %b %d    %%Jan 15
    axisFormat %m/%d    %%01/15
```

## Sections

```mermaid
gantt
    section Planning
        Task 1 : a1, 2024-01-01, 5d
    section Development
        Task 2 : a2, after a1, 10d
    section Testing
        Task 3 : a3, after a2, 5d
```

## Task Syntax

**Full syntax:**
```
TaskName : [status], [id], [start], [duration or end]
```

**Examples:**
```mermaid
gantt
    dateFormat YYYY-MM-DD

    %% Explicit dates
    Task A : a1, 2024-01-01, 2024-01-10

    %% Start date + duration
    Task B : a2, 2024-01-05, 5d

    %% After dependency
    Task C : a3, after a1, 7d

    %% Multiple dependencies
    Task D : a4, after a1 a2, 3d

    %% No ID (auto-generated)
    Task E : 2024-01-15, 4d
```

## Task States

```mermaid
gantt
    dateFormat YYYY-MM-DD

    %% Active (in progress)
    Active Task : active, a1, 2024-01-01, 5d

    %% Done (completed)
    Done Task : done, a2, 2024-01-01, 3d

    %% Critical (highlighted)
    Critical Task : crit, a3, 2024-01-06, 4d

    %% Milestone (zero duration)
    Milestone : milestone, m1, 2024-01-10, 0d

    %% Combinations
    Critical Done : crit, done, a4, 2024-01-01, 2d
    Critical Active : crit, active, a5, 2024-01-03, 3d
```

## Dependencies

```mermaid
gantt
    dateFormat YYYY-MM-DD

    Task A : a1, 2024-01-01, 5d
    Task B : a2, after a1, 3d
    Task C : a3, after a1, 4d
    Task D : a4, after a2 a3, 2d
```

## Duration Units

- `5d` - 5 days
- `1w` - 1 week
- `2h` - 2 hours (with time format)
- `30m` - 30 minutes (with time format)

## Excluding Dates

```mermaid
gantt
    dateFormat YYYY-MM-DD
    excludes weekends
    excludes 2024-01-15, 2024-01-16
```

## Tick Intervals

```mermaid
gantt
    tickInterval 1day
    tickInterval 1week
    tickInterval 1month
```

## Complete Example

```mermaid
gantt
    title Software Development Project
    dateFormat YYYY-MM-DD
    excludes weekends
    tickInterval 1week

    section Planning
        Requirements Gathering : done, req, 2024-01-01, 10d
        Technical Design : done, des, after req, 7d
        Design Review : milestone, m1, after des, 0d

    section Development
        Backend API : crit, active, api, after des, 15d
        Database Schema : active, db, after des, 5d
        Frontend UI : fe, after db, 12d
        Integration : int, after api fe, 5d

    section Testing
        Unit Tests : ut, after api, 8d
        Integration Tests : it, after int, 5d
        UAT : uat, after it, 7d
        Bug Fixes : crit, bf, after uat, 5d

    section Deployment
        Staging Deploy : stg, after bf, 2d
        Production Deploy : milestone, m2, after stg, 0d
        Go Live : crit, milestone, m3, after m2, 0d
```
