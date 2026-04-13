# Arrow Routing Reference

## Core Requirements

Three essential properties enable proper elbow arrow functionality:
- `"roughness": 0` - Clean lines
- `"roundness": null` - Sharp corners
- `"elbowed": true` - Activate elbow mode

Without these settings, arrows will be curved, not 90-degree elbows.

## Edge Calculation

### Rectangle Edge Points
- **Top**: `(x + width/2, y)`
- **Bottom**: `(x + width/2, y + height)`
- **Left**: `(x, y + height/2)`
- **Right**: `(x + width, y + height/2)`

### Ellipse Edge Points
- **Top**: `(x + width/2, y)`
- **Bottom**: `(x + width/2, y + height)`
- **Left**: `(x, y + height/2)`
- **Right**: `(x + width, y + height/2)`

## Universal Routing Algorithm

```javascript
function routeArrow(sourceEdge, targetEdge, startPoint, endPoint) {
  const midX = (startPoint.x + endPoint.x) / 2;
  const midY = (startPoint.y + endPoint.y) / 2;

  // Determine routing based on edge alignment
  if (sourceEdge === 'bottom' && targetEdge === 'top') {
    // Straight vertical or L-shape
    return [startPoint, {x: startPoint.x, y: midY}, {x: endPoint.x, y: midY}, endPoint];
  }
  // Add patterns for other edge combinations...
}
```

## Arrow Patterns

### 1. Vertical Down (Bottom → Top)
```json
"points": [[0, 0], [0, 50], [0, 100]]
```

### 2. Horizontal Right (Right → Left)
```json
"points": [[0, 0], [50, 0], [100, 0]]
```

### 3. L-Shape (Bottom → Left)
```json
"points": [[0, 0], [0, 50], [100, 50]]
```

### 4. S-Shape (Obstacle Navigation)
```json
"points": [[0, 0], [0, 30], [100, 30], [100, 60], [0, 60], [0, 90]]
```

### 5. U-Turn (Callbacks)
Add 40-60px clearance from source shape.

## Staggering Multiple Arrows

When multiple arrows originate from one edge, distribute evenly across 20%-80% of the shape's length:

```javascript
function staggerPosition(index, totalCount, shapeLength) {
  const position = 0.2 + (0.6 * index / totalCount);
  return position * shapeLength;
}
```

## Bindings

Attach arrows to shapes dynamically using `startBinding` and `endBinding`:

```json
{
  "startBinding": {
    "elementId": "shape-1",
    "focus": 0,
    "gap": 5,
    "fixedPoint": [0.5, 1]  // Bottom center
  },
  "endBinding": {
    "elementId": "shape-2",
    "focus": 0,
    "gap": 5,
    "fixedPoint": [0.5, 0]  // Top center
  }
}
```

### Fixed Point Reference
- `[0.5, 0]` - Top center
- `[0.5, 1]` - Bottom center
- `[0, 0.5]` - Left center
- `[1, 0.5]` - Right center

## Arrow Labels

Position text at arrow midpoints:

```json
{
  "type": "text",
  "x": arrowMidX - textWidth/2,
  "y": arrowMidY - textHeight/2,
  "text": "label",
  "containerId": "arrow-id"
}
```

## Bidirectional Arrows

Use dual arrowheads:

```json
{
  "startArrowhead": "arrow",
  "endArrowhead": "arrow"
}
```

## Width/Height Calculation

Arrow width and height are the bounding box of all points:

```javascript
const width = Math.abs(Math.max(...points.map(p => p[0])) - Math.min(...points.map(p => p[0])));
const height = Math.abs(Math.max(...points.map(p => p[1])) - Math.min(...points.map(p => p[1])));
```
