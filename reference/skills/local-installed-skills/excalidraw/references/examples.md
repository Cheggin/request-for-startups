# Examples Reference

## 3-Tier Architecture Example

```json
{
  "type": "excalidraw",
  "version": 2,
  "elements": [
    {
      "type": "ellipse",
      "id": "user-1",
      "x": 400,
      "y": 20,
      "width": 80,
      "height": 80,
      "backgroundColor": "#e9ecef",
      "strokeColor": "#495057",
      "boundElements": [
        {"type": "text", "id": "user-1-label"}
      ]
    },
    {
      "type": "text",
      "id": "user-1-label",
      "x": 420,
      "y": 50,
      "width": 40,
      "height": 20,
      "text": "User",
      "containerId": "user-1"
    },
    {
      "type": "rectangle",
      "id": "frontend-1",
      "x": 350,
      "y": 150,
      "width": 180,
      "height": 80,
      "backgroundColor": "#a5d8ff",
      "strokeColor": "#1971c2",
      "boundElements": [
        {"type": "text", "id": "frontend-1-label"}
      ]
    },
    {
      "type": "text",
      "id": "frontend-1-label",
      "x": 355,
      "y": 180,
      "width": 170,
      "height": 20,
      "text": "Frontend",
      "containerId": "frontend-1"
    },
    {
      "type": "rectangle",
      "id": "backend-1",
      "x": 350,
      "y": 280,
      "width": 180,
      "height": 80,
      "backgroundColor": "#d0bfff",
      "strokeColor": "#7048e8",
      "boundElements": [
        {"type": "text", "id": "backend-1-label"}
      ]
    },
    {
      "type": "text",
      "id": "backend-1-label",
      "x": 355,
      "y": 310,
      "width": 170,
      "height": 20,
      "text": "Backend API",
      "containerId": "backend-1"
    },
    {
      "type": "rectangle",
      "id": "database-1",
      "x": 350,
      "y": 410,
      "width": 180,
      "height": 80,
      "backgroundColor": "#b2f2bb",
      "strokeColor": "#2f9e44",
      "boundElements": [
        {"type": "text", "id": "database-1-label"}
      ]
    },
    {
      "type": "text",
      "id": "database-1-label",
      "x": 355,
      "y": 440,
      "width": 170,
      "height": 20,
      "text": "PostgreSQL",
      "containerId": "database-1"
    },
    {
      "type": "arrow",
      "id": "arrow-1",
      "x": 440,
      "y": 100,
      "width": 0,
      "height": 50,
      "points": [[0, 0], [0, 50]],
      "startBinding": {"elementId": "user-1", "focus": 0, "gap": 5},
      "endBinding": {"elementId": "frontend-1", "focus": 0, "gap": 5},
      "elbowed": true,
      "roundness": null,
      "roughness": 0
    }
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff"
  },
  "files": {}
}
```

## Layout Patterns

### Vertical Flow (Most Common)

Grid system with standard positions:

| Row | Y Position |
|-----|------------|
| 1 | 20-100 |
| 2 | 150-230 |
| 3 | 280-360 |
| 4 | 410-490 |
| 5 | 540-620 |
| 6 | 670-750 |
| 7 | 800-880 |

| Column | X Position |
|--------|------------|
| 1 | 100 |
| 2 | 300 |
| 3 | 500 |
| 4 | 700 |
| 5 | 900 |

### Horizontal Flow (Pipelines)

Stages positioned horizontally at consistent y-coordinate:

```
Stage 1 (x: 100) → Stage 2 (x: 350) → Stage 3 (x: 600) → Stage 4 (x: 850) → Stage 5 (x: 1100)
```

All at y: 200

### Hub-and-Spoke

Central element at (500, 350) with surrounding positions at 45° increments:

| Position | X | Y |
|----------|---|---|
| Top | 500 | 100 |
| Top-Right | 750 | 150 |
| Right | 800 | 350 |
| Bottom-Right | 750 | 550 |
| Bottom | 500 | 600 |
| Bottom-Left | 250 | 550 |
| Left | 200 | 350 |
| Top-Left | 250 | 150 |

## Complexity Guidelines

| Complexity | Element Count | Recommendations |
|------------|--------------|-----------------|
| Simple | 5-10 | Single vertical flow |
| Medium | 10-25 | Use grouping rectangles |
| Complex | 25-50 | Multiple sections, clear boundaries |
| Very Complex | 50+ | Split into multiple diagrams |

## Spacing Standards

| Dimension | Standard Value |
|-----------|---------------|
| Column Width | 200-250px |
| Row Height | 130-150px |
| Element Spacing | 40-50px |
| Element Width | 160-200px |
| Element Height | 80-90px |
| Group Padding | 20px |
| Arrow Gap | 5px |

## Common Element Sizes

| Element Type | Width | Height |
|-------------|-------|--------|
| Service/Component | 180 | 80 |
| Database | 180 | 80 |
| User (Ellipse) | 80 | 80 |
| External System | 180 | 80 |
| Group Container | varies | varies |
| Text Label | auto | 20 |
