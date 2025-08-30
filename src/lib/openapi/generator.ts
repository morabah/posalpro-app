// Lightweight OpenAPI generator scaffolding using zod-to-openapi (optional)
import { getApiConfig, getConfig } from '@/lib/env';

// Import Zod schemas to register
import * as Schemas from '@/lib/validation/schemas';

// Generate a minimal OpenAPI document.
// If zod-to-openapi is not installed, produces a basic stub document.
export async function generateOpenAPISpec() {
  const app = getConfig();
  const api = getApiConfig();

  const baseDoc: any = {
    openapi: '3.0.3',
    info: {
      title: `${app.appName} API`,
      version: app.appVersion || '1.0.0',
      description:
        'Auto-generated OpenAPI spec scaffold. Some schemas may be missing until zod-to-openapi is installed and registration is expanded.',
    },
    servers: [{ url: api.baseUrl || '/api' }],
    paths: {},
    components: { schemas: {} },
  };

  // Dynamically import zod-to-openapi so the app builds even if the package
  // is not installed yet. Types are intentionally loose to avoid TS module errors.
  let z2o: any = null;
  try {
    z2o = await import('zod-to-openapi');
  } catch {
    // Fallback: return a minimal doc with a hint
    baseDoc.info.description += ' Install dev dependency: npm i -D zod-to-openapi';
    return baseDoc;
  }

  const OpenAPIRegistry = z2o.OpenAPIRegistry || z2o.OpenApiRegistry;
  const OpenAPIGeneratorV3 = z2o.OpenAPIGeneratorV3 || z2o.OpenApiGeneratorV3;

  if (!OpenAPIRegistry || !OpenAPIGeneratorV3) {
    // Unexpected import shape; return base
    return baseDoc;
  }

  const registry = new OpenAPIRegistry();

  // Register a small set of core schemas to start; expand iteratively
  // These names are used as component schema keys
  try {
    if ((Schemas as any).proposalMetadataSchema)
      registry.register('ProposalMetadata', (Schemas as any).proposalMetadataSchema);
    if ((Schemas as any).statusUpdatePayloadSchema)
      registry.register('StatusUpdatePayload', (Schemas as any).statusUpdatePayloadSchema);
    if ((Schemas as any).customerSchema)
      registry.register('Customer', (Schemas as any).customerSchema);
    if ((Schemas as any).productSchema)
      registry.register('Product', (Schemas as any).productSchema);
    if ((Schemas as any).userProfileSchema)
      registry.register('UserProfile', (Schemas as any).userProfileSchema);
  } catch {
    // Schema registration is best-effort at this stage
  }

  const generator = new OpenAPIGeneratorV3(registry.definitions);
  const doc = generator.generateDocument(baseDoc);
  return doc;
}
