/**
 * PDF Template Registry
 *
 * This registry manages available PDF templates and provides a centralized
 * way to add new templates without modifying the main PDF route.
 */

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  available: boolean;
  buildFunction: string; // Function name to call
}

export interface TemplateRegistry {
  [templateId: string]: TemplateInfo;
}

// Template registry - add new templates here
export const TEMPLATE_REGISTRY: TemplateRegistry = {
  preview: {
    id: 'preview',
    name: 'Preview',
    description: 'Browser print styles - matches the preview page exactly',
    available: true,
    buildFunction: 'renderPreviewPage', // Uses preview page rendering
  },
  strict: {
    id: 'strict',
    name: 'Strict',
    description: 'Custom layout with intelligent page breaks and professional formatting',
    available: true,
    buildFunction: 'buildStrictHtml',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, minimal layout with essential information only',
    available: false, // Coming soon
    buildFunction: 'buildMinimalHtml',
  },
  detailed: {
    id: 'detailed',
    name: 'Detailed',
    description: 'Comprehensive layout with all available information and enhanced formatting',
    available: false, // Coming soon
    buildFunction: 'buildDetailedHtml',
  },
};

/**
 * Get template information by ID
 */
export function getTemplateInfo(templateId: string): TemplateInfo | null {
  return TEMPLATE_REGISTRY[templateId] || null;
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): TemplateInfo[] {
  return Object.values(TEMPLATE_REGISTRY).filter(template => template.available);
}

/**
 * Check if a template is available
 */
export function isTemplateAvailable(templateId: string): boolean {
  const template = getTemplateInfo(templateId);
  return template ? template.available : false;
}

/**
 * Get the build function name for a template
 */
export function getTemplateBuildFunction(templateId: string): string | null {
  const template = getTemplateInfo(templateId);
  return template ? template.buildFunction : null;
}

/**
 * Add a new template to the registry
 *
 * @param templateId - Unique identifier for the template
 * @param templateInfo - Template information
 */
export function registerTemplate(templateId: string, templateInfo: Omit<TemplateInfo, 'id'>): void {
  TEMPLATE_REGISTRY[templateId] = {
    id: templateId,
    ...templateInfo,
  };
}

/**
 * Remove a template from the registry
 */
export function unregisterTemplate(templateId: string): void {
  delete TEMPLATE_REGISTRY[templateId];
}
