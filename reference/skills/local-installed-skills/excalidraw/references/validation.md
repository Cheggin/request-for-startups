# Validation Reference

## Pre-Flight Validation Algorithm

```javascript
function validateDiagram(elements) {
  const errors = [];
  const ids = new Set();

  // Check for duplicate IDs
  for (const el of elements) {
    if (ids.has(el.id)) {
      errors.push(`Duplicate ID: ${el.id}`);
    }
    ids.add(el.id);
  }

  // Validate shape-text bindings
  for (const el of elements) {
    if (el.boundElements) {
      for (const bound of el.boundElements) {
        if (bound.type === 'text') {
          const textEl = elements.find(e => e.id === bound.id);
          if (!textEl) {
            errors.push(`Missing text element: ${bound.id}`);
          } else if (textEl.containerId !== el.id) {
            errors.push(`Text ${bound.id} containerId mismatch`);
          }
        }
      }
    }
  }

  // Validate arrow bindings
  for (const el of elements) {
    if (el.type === 'arrow') {
      if (el.startBinding) {
        const target = elements.find(e => e.id === el.startBinding.elementId);
        if (!target) {
          errors.push(`Arrow ${el.id} start binding missing target`);
        }
      }
      if (el.endBinding) {
        const target = elements.find(e => e.id === el.endBinding.elementId);
        if (!target) {
          errors.push(`Arrow ${el.id} end binding missing target`);
        }
      }
    }
  }

  return errors;
}

function findShapeNear(elements, x, y, tolerance = 15) {
  return elements.find(el =>
    el.type !== 'text' &&
    el.type !== 'arrow' &&
    Math.abs(el.x - x) < tolerance &&
    Math.abs(el.y - y) < tolerance
  );
}
```

## Pre-Generation Checklist

- [ ] Identified all components in codebase
- [ ] Mapped all connections/dependencies
- [ ] Planned layout (vertical/horizontal/hub-spoke)
- [ ] Assigned colors based on component types
- [ ] Determined grouping boundaries

## Generation Checklist

- [ ] Each shape has unique ID
- [ ] Each labeled shape has matching text element
- [ ] Text elements have correct `containerId`
- [ ] Shapes have `boundElements` array with text references
- [ ] Arrow points array is valid
- [ ] Arrow bindings reference existing shapes

## Arrow Validation Checklist

- [ ] Arrow x,y matches first point origin
- [ ] Points array starts with [0, 0]
- [ ] Final point offset is correct
- [ ] Width/height matches bounding box
- [ ] `elbowed: true` for 90-degree corners
- [ ] `roundness: null` for sharp corners
- [ ] `roughness: 0` for clean lines
- [ ] Start/end bindings valid

## Post-Generation Checklist

- [ ] All IDs are unique
- [ ] No orphaned text elements
- [ ] All boundElements references exist
- [ ] All containerId references exist
- [ ] All arrow bindings valid
- [ ] JSON is valid (parseable)
- [ ] File saves with .excalidraw extension

## Common Bugs and Fixes

### 1. Disconnected Arrows

**Symptom**: Arrow floats away from shape

**Fix**: Calculate arrow origin from shape edge:

```javascript
// For arrow from bottom of shape to top of target
arrow.x = shape.x + shape.width / 2;
arrow.y = shape.y + shape.height;
```

### 2. Unreached Endpoints

**Symptom**: Arrow doesn't reach target

**Fix**: Correct final point offset:

```javascript
const endX = target.x + target.width / 2 - arrow.x;
const endY = target.y - arrow.y;
points.push([endX, endY]);
```

### 3. Overlapping Arrows

**Symptom**: Multiple arrows stack on same path

**Fix**: Implement staggering:

```javascript
function staggerOffset(index, total, length) {
  const spacing = length * 0.6 / total;
  const start = length * 0.2;
  return start + spacing * index;
}
```

### 4. Looping Callbacks

**Symptom**: Self-referential arrows look cramped

**Fix**: Add 40-60px clearance:

```javascript
const clearance = 50;
points = [
  [0, 0],
  [clearance, 0],
  [clearance, shape.height + clearance],
  [-clearance, shape.height + clearance],
  [-clearance, 0]
];
```

### 5. Missing Labels

**Symptom**: Shape appears but no text inside

**Fix**: Create both elements with proper binding:

```javascript
const shape = {
  id: 'shape-1',
  boundElements: [{ type: 'text', id: 'shape-1-label' }]
};

const label = {
  id: 'shape-1-label',
  containerId: 'shape-1',
  text: 'Label'
};
```

### 6. Curved Arrows

**Symptom**: Arrows curve instead of 90-degree elbows

**Fix**: Apply all three properties:

```javascript
{
  elbowed: true,
  roundness: null,
  roughness: 0
}
```

## Validation Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Duplicate ID" | Two elements share same ID | Generate unique IDs |
| "Missing text element" | boundElements references non-existent text | Create text element |
| "containerId mismatch" | Text points to wrong shape | Fix containerId value |
| "start binding missing target" | Arrow startBinding.elementId invalid | Fix elementId reference |
| "Invalid points array" | Points malformed | Ensure [[x,y], ...] format |
