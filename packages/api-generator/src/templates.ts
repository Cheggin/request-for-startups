/**
 * Common Next.js API route patterns for reuse across different route types.
 * Each template produces a route handler string following App Router conventions.
 */

export interface RouteTemplate {
  name: string;
  description: string;
  methods: string[];
  /** Generate the route file content */
  generate(opts: RouteTemplateOptions): string;
}

export interface RouteTemplateOptions {
  /** Resource name (e.g. "users", "posts") */
  resource: string;
  /** Whether auth is required */
  auth: boolean;
  /** Additional fields for the resource */
  fields?: { name: string; type: string; required: boolean }[];
}

function zodType(type: string): string {
  const map: Record<string, string> = {
    string: "z.string()",
    number: "z.number()",
    boolean: "z.boolean()",
    email: 'z.string().email()',
    url: 'z.string().url()',
    uuid: 'z.string().uuid()',
  };
  return map[type.toLowerCase()] ?? "z.string()";
}

function buildZodFields(fields: { name: string; type: string; required: boolean }[]): string {
  return fields
    .map((f) => {
      const base = zodType(f.type);
      return f.required ? `  ${f.name}: ${base},` : `  ${f.name}: ${base}.optional(),`;
    })
    .join("\n");
}

function authCheck(auth: boolean): string {
  if (!auth) return "";
  return `
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }
`;
}

function authImport(auth: boolean): string {
  if (!auth) return "";
  return '\nimport { getSession } from "@/lib/auth";';
}

export const CRUD_TEMPLATE: RouteTemplate = {
  name: "crud",
  description: "Full CRUD operations (GET list, GET by id, POST create, PUT update, DELETE)",
  methods: ["GET", "POST", "PUT", "DELETE"],
  generate(opts) {
    const { resource, auth, fields = [] } = opts;
    const singular = resource.endsWith("s") ? resource.slice(0, -1) : resource;
    const createFields = fields.length > 0
      ? buildZodFields(fields)
      : `  name: z.string(),`;
    const updateFields = fields.length > 0
      ? buildZodFields(fields.map((f) => ({ ...f, required: false })))
      : `  name: z.string().optional(),`;

    return `import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";${authImport(auth)}

const create${singular}Schema = z.object({
${createFields}
});

const update${singular}Schema = z.object({
  id: z.string(),
${updateFields}
});

/**
 * GET /api/${resource}
 * @description List all ${resource} or get a single ${singular} by id query param.
 * @returns {Array} List of ${resource} or a single ${singular} object.
 * @throws {401} If authentication is required and missing.
 */
export async function GET(request: NextRequest) {
  try {${authCheck(auth)}
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // TODO: Fetch ${singular} by id from database
      return NextResponse.json({ id, resource: "${singular}" });
    }

    // TODO: Fetch all ${resource} from database
    return NextResponse.json({ data: [], total: 0 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/${resource}
 * @description Create a new ${singular}.
 * @param {object} body - The ${singular} data matching create${singular}Schema.
 * @returns {object} The created ${singular}.
 * @throws {400} If request body fails validation.
 * @throws {401} If authentication is required and missing.
 */
export async function POST(request: NextRequest) {
  try {${authCheck(auth)}
    const body = await request.json();
    const parsed = create${singular}Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // TODO: Insert ${singular} into database
    return NextResponse.json(
      { ...parsed.data, id: crypto.randomUUID() },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/${resource}
 * @description Update an existing ${singular}.
 * @param {object} body - The ${singular} data matching update${singular}Schema.
 * @returns {object} The updated ${singular}.
 * @throws {400} If request body fails validation.
 * @throws {401} If authentication is required and missing.
 * @throws {404} If the ${singular} is not found.
 */
export async function PUT(request: NextRequest) {
  try {${authCheck(auth)}
    const body = await request.json();
    const parsed = update${singular}Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // TODO: Update ${singular} in database
    return NextResponse.json(parsed.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/${resource}
 * @description Delete a ${singular} by id.
 * @param {string} id - The ${singular} id from query params.
 * @returns {object} Confirmation of deletion.
 * @throws {400} If id is missing.
 * @throws {401} If authentication is required and missing.
 * @throws {404} If the ${singular} is not found.
 */
export async function DELETE(request: NextRequest) {
  try {${authCheck(auth)}
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter", code: "MISSING_PARAM" },
        { status: 400 }
      );
    }

    // TODO: Delete ${singular} from database
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
`;
  },
};

export const AUTH_PROTECTED_TEMPLATE: RouteTemplate = {
  name: "auth-protected",
  description: "Auth-protected route with session validation",
  methods: ["GET", "POST"],
  generate(opts) {
    const { resource } = opts;
    const singular = resource.endsWith("s") ? resource.slice(0, -1) : resource;

    return `import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";

const ${singular}Schema = z.object({
  name: z.string(),
});

/**
 * GET /api/${resource}
 * @description Get authenticated user's ${resource}. Requires valid session.
 * @returns {Array} List of ${resource} belonging to the authenticated user.
 * @throws {401} If session is invalid or missing.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // TODO: Fetch user's ${resource} from database
    return NextResponse.json({ data: [], userId: session.userId });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/${resource}
 * @description Create a new ${singular} for the authenticated user.
 * @param {object} body - The ${singular} data.
 * @returns {object} The created ${singular}.
 * @throws {400} If validation fails.
 * @throws {401} If session is invalid or missing.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = ${singular}Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // TODO: Insert ${singular} into database with session.userId
    return NextResponse.json(
      { ...parsed.data, id: crypto.randomUUID(), userId: session.userId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
`;
  },
};

export const WEBHOOK_HANDLER_TEMPLATE: RouteTemplate = {
  name: "webhook",
  description: "Webhook handler with signature verification",
  methods: ["POST"],
  generate(opts) {
    const { resource } = opts;

    return `import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * POST /api/${resource}/webhook
 * @description Handle incoming webhook events for ${resource}.
 * Verifies webhook signature before processing.
 * @param {object} body - The webhook event payload.
 * @returns {object} Acknowledgement of webhook receipt.
 * @throws {400} If signature verification fails.
 * @throws {500} If webhook processing fails.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("x-webhook-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature", code: "MISSING_SIGNATURE" },
        { status: 400 }
      );
    }

    // TODO: Verify webhook signature
    // const isValid = verifySignature(body, signature, process.env.WEBHOOK_SECRET);
    // if (!isValid) {
    //   return NextResponse.json(
    //     { error: "Invalid signature", code: "INVALID_SIGNATURE" },
    //     { status: 400 }
    //   );
    // }

    const event = JSON.parse(body);

    switch (event.type) {
      case "${resource}.created":
        // TODO: Handle created event
        break;
      case "${resource}.updated":
        // TODO: Handle updated event
        break;
      case "${resource}.deleted":
        // TODO: Handle deleted event
        break;
      default:
        console.warn(\`Unhandled webhook event type: \${event.type}\`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Webhook processing failed", code: "WEBHOOK_ERROR" },
      { status: 500 }
    );
  }
}
`;
  },
};

export const FILE_UPLOAD_TEMPLATE: RouteTemplate = {
  name: "file-upload",
  description: "File upload handler with validation",
  methods: ["POST"],
  generate(opts) {
    const { resource, auth } = opts;

    return `import { NextRequest, NextResponse } from "next/server";${authImport(auth)}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * POST /api/${resource}/upload
 * @description Upload a file for ${resource}. Max 10MB. Allowed types: JPEG, PNG, WebP, PDF.
 * @param {FormData} body - Form data containing the file.
 * @returns {object} The upload metadata including storage URL.
 * @throws {400} If file is missing, too large, or wrong type.
 * @throws {401} If authentication is required and missing.
 */
export async function POST(request: NextRequest) {
  try {${authCheck(auth)}
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided", code: "MISSING_FILE" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB.", code: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: \`File type \${file.type} not allowed. Allowed: \${ALLOWED_TYPES.join(", ")}\`,
          code: "INVALID_FILE_TYPE",
        },
        { status: 400 }
      );
    }

    // TODO: Upload file to storage (e.g., Convex file storage, S3, etc.)
    const uploadResult = {
      id: crypto.randomUUID(),
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      url: \`/api/${resource}/files/\${crypto.randomUUID()}\`,
    };

    return NextResponse.json(uploadResult, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Upload failed", code: "UPLOAD_ERROR" },
      { status: 500 }
    );
  }
}
`;
  },
};

export const ALL_ROUTE_TEMPLATES: RouteTemplate[] = [
  CRUD_TEMPLATE,
  AUTH_PROTECTED_TEMPLATE,
  WEBHOOK_HANDLER_TEMPLATE,
  FILE_UPLOAD_TEMPLATE,
];

/**
 * Get a route template by name.
 */
export function getRouteTemplate(name: string): RouteTemplate | undefined {
  return ALL_ROUTE_TEMPLATES.find((t) => t.name === name);
}
