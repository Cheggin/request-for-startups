# Excalidraw JSON Format Reference

## File Structure

```json
{
  "type": "excalidraw",
  "version": 2,
  "elements": [],
  "appState": {
    "viewBackgroundColor": "#ffffff"
  },
  "files": {}
}
```

## Element Types

### Rectangle

```json
{
  "type": "rectangle",
  "id": "unique-id",
  "x": 100,
  "y": 100,
  "width": 180,
  "height": 80,
  "angle": 0,
  "strokeColor": "#1971c2",
  "backgroundColor": "#a5d8ff",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 1,
  "opacity": 100,
  "roundness": {"type": 3},
  "boundElements": [
    {"type": "text", "id": "text-id"},
    {"type": "arrow", "id": "arrow-id"}
  ]
}
```

### Ellipse

```json
{
  "type": "ellipse",
  "id": "unique-id",
  "x": 100,
  "y": 100,
  "width": 80,
  "height": 80,
  "strokeColor": "#495057",
  "backgroundColor": "#e9ecef",
  "boundElements": []
}
```

### Text (Standalone)

```json
{
  "type": "text",
  "id": "unique-id",
  "x": 100,
  "y": 100,
  "width": 100,
  "height": 20,
  "text": "Label Text",
  "fontSize": 16,
  "fontFamily": 1,
  "textAlign": "center",
  "verticalAlign": "middle",
  "containerId": null
}
```

### Text (Bound to Shape)

```json
{
  "type": "text",
  "id": "text-id",
  "x": 105,
  "y": 130,
  "width": 170,
  "height": 20,
  "text": "Label Text",
  "fontSize": 16,
  "fontFamily": 1,
  "textAlign": "center",
  "verticalAlign": "middle",
  "containerId": "shape-id"
}
```

### Arrow

```json
{
  "type": "arrow",
  "id": "unique-id",
  "x": 100,
  "y": 180,
  "width": 0,
  "height": 100,
  "points": [[0, 0], [0, 100]],
  "startBinding": {
    "elementId": "source-id",
    "focus": 0,
    "gap": 5,
    "fixedPoint": [0.5, 1]
  },
  "endBinding": {
    "elementId": "target-id",
    "focus": 0,
    "gap": 5,
    "fixedPoint": [0.5, 0]
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "elbowed": true,
  "roundness": null,
  "roughness": 0
}
```

### Line

```json
{
  "type": "line",
  "id": "unique-id",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 0,
  "points": [[0, 0], [200, 0]],
  "strokeStyle": "dashed"
}
```

## CRITICAL: Diamond Shapes

**NEVER use `type: "diamond"` in generated diagrams.**

Diamond shapes have rendering issues with arrow connections in raw JSON. Instead, use styled rectangles:

### Orchestrator/Decision Point Alternative

```json
{
  "type": "rectangle",
  "backgroundColor": "#ffc078",
  "strokeColor": "#e8590c",
  "strokeWidth": 4,
  "roundness": {"type": 3}
}
```

### Decision Point with Dashed Border

```json
{
  "type": "rectangle",
  "backgroundColor": "#fff3bf",
  "strokeColor": "#f59f00",
  "strokeStyle": "dashed"
}
```

## Labeling Requirements

Labels require TWO elements with cross-references:

### Shape Element

```json
{
  "type": "rectangle",
  "id": "shape-1",
  "boundElements": [
    {"type": "text", "id": "shape-1-label"}
  ]
}
```

### Text Element

```json
{
  "type": "text",
  "id": "shape-1-label",
  "containerId": "shape-1"
}
```

**Important**: The `label` property is for the JavaScript API, NOT raw JSON files.

## Text Positioning Formula

```javascript
text.x = shape.x + 5;
text.y = shape.y + (shape.height - text.height) / 2;
text.width = shape.width - 10;
```

## Grouping with Dashed Rectangles

```json
{
  "type": "rectangle",
  "id": "group-1",
  "x": 80,
  "y": 80,
  "width": 400,
  "height": 300,
  "backgroundColor": "transparent",
  "strokeColor": "#868e96",
  "strokeStyle": "dashed",
  "strokeWidth": 1
}
```

Group label as standalone text:

```json
{
  "type": "text",
  "id": "group-1-title",
  "x": 90,
  "y": 85,
  "text": "Group Name",
  "fontSize": 14,
  "containerId": null
}
```

## Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier |
| `x`, `y` | number | Position |
| `width`, `height` | number | Dimensions |
| `angle` | number | Rotation (radians) |
| `strokeColor` | string | Border color |
| `backgroundColor` | string | Fill color |
| `fillStyle` | string | `"solid"`, `"hachure"`, `"cross-hatch"` |
| `strokeWidth` | number | Border thickness |
| `strokeStyle` | string | `"solid"`, `"dashed"`, `"dotted"` |
| `roughness` | number | 0=smooth, 1=normal, 2=rough |
| `opacity` | number | 0-100 |
| `roundness` | object | `{"type": 3}` for rounded corners |

## Font Families

| Value | Font |
|-------|------|
| 1 | Hand-drawn (Virgil) |
| 2 | Normal |
| 3 | Code (monospace) |
