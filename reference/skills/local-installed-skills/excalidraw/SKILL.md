# Excalidraw Diagram Generator

Generate architecture diagrams as `.excalidraw` files by analyzing codebases. No existing diagrams or specialized file types required.

## When to Use This Skill

Use this skill when the user asks to:
- Create an architecture diagram
- Generate an Excalidraw diagram
- Visualize system architecture
- Create component/service diagrams
- Generate infrastructure diagrams

## Core Functionality

Analyze codebases to identify components, services, databases, and APIs. Map relationships and data flows into valid Excalidraw JSON format with dynamically generated IDs and labels.

## Critical Technical Rules

### Shape and Connection Standards
- **NEVER use diamond shapes** - use styled rectangles instead
- Every labeled shape requires TWO JSON elements:
  1. The shape with `boundElements` reference
  2. A separate text element with matching `containerId`
- Elbow arrows need: `"elbowed": true`, `"roundness": null`, `"roughness": 0` for 90-degree corners
- Arrow endpoints must align with shape edges using calculated coordinates, not centers

### Element Generation Workflow

1. **Codebase Analysis** - Locate components via glob patterns and grep searches across monorepos, microservices, IaC files, APIs, and frontends
2. **Layout Planning** - Organize vertically with rows at y-coordinates 100, 230, 380, 530, 680
3. **Element Creation** - Build shapes with unique IDs and accompanying text labels
4. **Connection Mapping** - Calculate edge points and create arrow routing with `points` arrays
5. **Optional Grouping** - Use dashed rectangles for logical boundaries
6. **Validation** - Verify all elements before file output

## Color Palette

Apply semantic colors:
- **Frontends**: Blue (`#a5d8ff` background, `#1971c2` stroke)
- **Backends**: Purple
- **Databases**: Green
- **Storage**: Yellow
- **Orchestrators**: Coral with thick strokes
- **External APIs**: Red

## Output

Save generated `.excalidraw` files to `docs/architecture/` or user-specified paths.

## References

See the `references/` directory for detailed specifications:
- `arrows.md` - Arrow routing and elbow connections
- `colors.md` - Color palettes for different platforms
- `examples.md` - Layout patterns and JSON templates
- `json-format.md` - Excalidraw JSON structure specification
- `validation.md` - Pre-flight validation and common fixes
