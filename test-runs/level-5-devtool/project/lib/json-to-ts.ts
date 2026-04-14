// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConvertOptions {
  rootName?: string;
  style?: "interface" | "type";
  exportKeyword?: boolean;
  optional?: boolean;
  readonly?: boolean;
}

interface InterfaceEntry {
  name: string;
  properties: PropertyEntry[];
}

interface PropertyEntry {
  key: string;
  type: string;
  optional: boolean;
}

// ─── Name Registry ───────────────────────────────────────────────────────────

class NameRegistry {
  private used = new Map<string, number>();

  claim(base: string): string {
    const count = this.used.get(base) ?? 0;
    this.used.set(base, count + 1);
    return count === 0 ? base : `${base}${count + 1}`;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[a-z]/, (c) => c.toUpperCase());
}

function isPrimitive(value: unknown): boolean {
  return value === null || typeof value !== "object";
}

// ─── Core Engine ─────────────────────────────────────────────────────────────

function inferType(
  value: unknown,
  name: string,
  registry: NameRegistry,
  interfaces: InterfaceEntry[]
): string {
  if (value === null) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";

  if (Array.isArray(value)) {
    return inferArrayType(value, name, registry, interfaces);
  }

  if (typeof value === "object") {
    return inferObjectType(
      value as Record<string, unknown>,
      name,
      registry,
      interfaces
    );
  }

  return "unknown";
}

function inferArrayType(
  arr: unknown[],
  parentName: string,
  registry: NameRegistry,
  interfaces: InterfaceEntry[]
): string {
  if (arr.length === 0) return "unknown[]";

  const allObjects = arr.every(
    (item) => item !== null && typeof item === "object" && !Array.isArray(item)
  );

  if (allObjects) {
    const merged = mergeObjects(
      arr as Record<string, unknown>[],
      parentName,
      registry,
      interfaces
    );
    return `${merged}[]`;
  }

  const types = new Set<string>();
  for (const item of arr) {
    if (item !== null && typeof item === "object" && !Array.isArray(item)) {
      const typeName = inferObjectType(
        item as Record<string, unknown>,
        parentName,
        registry,
        interfaces
      );
      types.add(typeName);
    } else if (Array.isArray(item)) {
      types.add(inferArrayType(item, parentName, registry, interfaces));
    } else {
      types.add(inferType(item, parentName, registry, interfaces));
    }
  }

  const typeArr = Array.from(types);
  if (typeArr.length === 1) return `${typeArr[0]}[]`;
  return `(${typeArr.join(" | ")})[]`;
}

function mergeObjects(
  objects: Record<string, unknown>[],
  name: string,
  registry: NameRegistry,
  interfaces: InterfaceEntry[]
): string {
  const allKeys = new Set<string>();
  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      allKeys.add(key);
    }
  }

  const properties: PropertyEntry[] = [];

  for (const key of allKeys) {
    const appearances = objects.filter((obj) => key in obj);
    const isOptional = appearances.length < objects.length;

    const values = appearances.map((obj) => obj[key]);
    const childName = toPascalCase(key);

    const allChildPrimitive = values.every((v) => isPrimitive(v));

    let type: string;
    if (allChildPrimitive) {
      const types = new Set(
        values.map((v) => inferType(v, childName, registry, interfaces))
      );
      const typeArr = Array.from(types);
      type = typeArr.length === 1 ? typeArr[0] : typeArr.join(" | ");
    } else {
      const allChildObjects = values.every(
        (v) => v !== null && typeof v === "object" && !Array.isArray(v)
      );
      if (allChildObjects) {
        type = mergeObjects(
          values as Record<string, unknown>[],
          childName,
          registry,
          interfaces
        );
      } else {
        type = inferType(values[0], childName, registry, interfaces);
      }
    }

    properties.push({ key, type, optional: isOptional });
  }

  const interfaceName = registry.claim(name);
  interfaces.push({ name: interfaceName, properties });
  return interfaceName;
}

function inferObjectType(
  obj: Record<string, unknown>,
  name: string,
  registry: NameRegistry,
  interfaces: InterfaceEntry[]
): string {
  const keys = Object.keys(obj);
  if (keys.length === 0) return "Record<string, unknown>";

  const properties: PropertyEntry[] = [];

  for (const key of keys) {
    const value = obj[key];
    const childName = toPascalCase(key);
    const type = inferType(value, childName, registry, interfaces);
    properties.push({ key, type, optional: false });
  }

  const interfaceName = registry.claim(name);
  interfaces.push({ name: interfaceName, properties });
  return interfaceName;
}

// ─── Formatter ───────────────────────────────────────────────────────────────

function formatInterfaces(
  interfaces: InterfaceEntry[],
  options: ConvertOptions
): string {
  const {
    style = "interface",
    exportKeyword = true,
    optional: allOptional = false,
    readonly: allReadonly = false,
  } = options;

  const prefix = exportKeyword ? "export " : "";

  return interfaces
    .map((entry) => {
      const props = entry.properties
        .map((prop) => {
          const opt = prop.optional || allOptional ? "?" : "";
          const ro = allReadonly ? "readonly " : "";
          return `  ${ro}${prop.key}${opt}: ${prop.type};`;
        })
        .join("\n");

      if (style === "type") {
        return `${prefix}type ${entry.name} = {\n${props}\n};`;
      }
      return `${prefix}interface ${entry.name} {\n${props}\n}`;
    })
    .join("\n\n");
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function convert(json: string, options: ConvertOptions = {}): string {
  const { rootName = "Root" } = options;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    const err = e as SyntaxError;
    throw new Error(`Invalid JSON: ${err.message}`);
  }

  const registry = new NameRegistry();
  const interfaces: InterfaceEntry[] = [];

  if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
    inferObjectType(
      parsed as Record<string, unknown>,
      rootName,
      registry,
      interfaces
    );
  } else if (Array.isArray(parsed)) {
    const itemName = rootName + "Item";
    const itemType = inferArrayType(parsed, itemName, registry, interfaces);
    const exportKw = options.exportKeyword !== false ? "export " : "";
    return (
      formatInterfaces(interfaces, options) +
      (interfaces.length > 0 ? "\n\n" : "") +
      `${exportKw}type ${rootName} = ${itemType};`
    );
  } else {
    const type = inferType(parsed, rootName, registry, interfaces);
    const exportKw = options.exportKeyword !== false ? "export " : "";
    return `${exportKw}type ${rootName} = ${type};`;
  }

  return formatInterfaces(interfaces, options);
}
