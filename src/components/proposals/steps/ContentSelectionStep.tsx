'use client';

/**
 * PosalPro MVP2 - Modern Content Selection Step
 * Built from scratch using React Query and modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ProposalContentData, useProposalActions } from '@/lib/store/proposalStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface ContentSelectionStepProps {
  data?: ProposalContentData;
  onNext: () => void;
  onBack: () => void;
  onUpdate?: (data: ProposalContentData) => void;
}

// ✅ REACT HOOK FORM SCHEMA FOR CONTENT SELECTION
const contentSelectionSchema = z.object({
  search: z.string().optional(),
  selectedTemplates: z.array(z.string()).optional(),
});

type ContentSelectionFormData = z.infer<typeof contentSelectionSchema>;

// Mock content templates - in real app, these would come from API
const CONTENT_TEMPLATES = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    category: 'Overview',
    content: 'Executive summary template content...',
  },
  {
    id: 'technical-specs',
    title: 'Technical Specifications',
    category: 'Technical',
    content: 'Technical specifications template...',
  },
  {
    id: 'pricing',
    title: 'Pricing Structure',
    category: 'Commercial',
    content: 'Pricing structure template...',
  },
  {
    id: 'timeline',
    title: 'Project Timeline',
    category: 'Planning',
    content: 'Project timeline template...',
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    category: 'Legal',
    content: 'Terms and conditions template...',
  },
];

export function ContentSelectionStep({
  data,
  onNext,
  onBack,
  onUpdate,
}: ContentSelectionStepProps) {
  const analytics = useOptimizedAnalytics();
  const { setStepData } = useProposalActions();

  // ✅ REACT HOOK FORM SETUP FOR CONTENT SELECTION
  const { register, control, watch, setValue } = useForm<ContentSelectionFormData>({
    resolver: zodResolver(contentSelectionSchema),
    defaultValues: {
      search: '',
      selectedTemplates: data?.selectedTemplates || [],
    },
  });

  // Local state for form data (keeping custom content separate for now)
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(
    data?.selectedTemplates || []
  );
  const [customContent, setCustomContent] = useState<ProposalContentData['customContent']>(
    data?.customContent || []
  );
  const [idCounter, setIdCounter] = useState(0);

  // Generate stable IDs
  const generateId = useCallback(() => {
    setIdCounter(prev => prev + 1);
    return `custom-${idCounter}`;
  }, [idCounter]);

  // Handle template selection
  const handleTemplateToggle = useCallback(
    (templateId: string) => {
      setSelectedTemplates(prev => {
        let newSelected;
        if (prev.includes(templateId)) {
          newSelected = prev.filter(id => id !== templateId);
        } else {
          newSelected = [...prev, templateId];
        }
        // Update React Hook Form value
        setValue('selectedTemplates', newSelected);
        return newSelected;
      });

      analytics.trackOptimized('content_template_toggled', {
        templateId,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    },
    [analytics]
  );

  // Handle custom content addition
  const handleAddCustomContent = useCallback(() => {
    const newContent = {
      id: generateId(),
      title: '',
      content: '',
      type: 'text' as const,
    };

    setCustomContent(prev => [...prev, newContent]);

    analytics.trackOptimized('custom_content_added', {
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });
  }, [analytics]);

  // Handle custom content update
  const handleCustomContentUpdate = useCallback(
    (id: string, field: 'title' | 'content', value: string) => {
      setCustomContent(prev =>
        prev.map(content => (content.id === id ? { ...content, [field]: value } : content))
      );
    },
    []
  );

  // Handle custom content removal
  const handleRemoveCustomContent = useCallback(
    (id: string) => {
      setCustomContent(prev => prev.filter(content => content.id !== id));

      analytics.trackOptimized('custom_content_removed', {
        contentId: id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    },
    [analytics]
  );

  // Persist step data continuously when selection changes
  useEffect(() => {
    setStepData(3, {
      selectedTemplates,
      customContent,
      contentLibrary: CONTENT_TEMPLATES.map(template => ({
        id: template.id,
        title: template.title,
        category: template.category,
        isSelected: selectedTemplates.includes(template.id),
      })),
    });
  }, [selectedTemplates, customContent, setStepData]);

  // Group templates by category
  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, typeof CONTENT_TEMPLATES> = {};
    CONTENT_TEMPLATES.forEach(template => {
      if (!grouped[template.category]) {
        grouped[template.category] = [];
      }
      grouped[template.category].push(template);
    });
    return grouped;
  }, []);

  const handleNext = useCallback(() => {
    // Update store with content data
    setStepData(3, {
      selectedTemplates,
      customContent,
      contentLibrary: CONTENT_TEMPLATES.map(template => ({
        id: template.id,
        title: template.title,
        category: template.category,
        isSelected: selectedTemplates.includes(template.id),
      })),
    });

    analytics.trackOptimized('proposal_step_completed', {
      step: 3,
      stepName: 'Content Selection',
      templateCount: selectedTemplates.length,
      customContentCount: customContent.length,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    onNext();
  }, [analytics, onNext, selectedTemplates, customContent, setStepData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Content Selection</h2>
        <p className="mt-2 text-gray-600">Choose content templates and add custom sections</p>
      </div>

      {/* Content Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Content Templates</h3>

        <div className="space-y-6">
          {Object.entries(templatesByCategory).map(([category, templates]) => (
            <div key={category}>
              <h4 className="text-md font-medium text-gray-700 mb-3">{category}</h4>
              <div className="space-y-3">
                {templates.map(template => (
                  <div key={template.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={template.id}
                      checked={selectedTemplates.includes(template.id)}
                      onChange={() => handleTemplateToggle(template.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={template.id}
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {template.title}
                      </label>
                      <p className="text-sm text-gray-500 mt-1">
                        {template.content.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Custom Content */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Custom Content</h3>
          <Button variant="outline" onClick={handleAddCustomContent}>
            Add Custom Section
          </Button>
        </div>

        <div className="space-y-4">
          {customContent.map(content => (
            <div key={content.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Input
                  placeholder="Section Title"
                  value={content.title}
                  onChange={e => handleCustomContentUpdate(content.id, 'title', e.target.value)}
                  className="flex-1 mr-3"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveCustomContent(content.id)}
                >
                  Remove
                </Button>
              </div>
              <textarea
                placeholder="Enter content..."
                value={content.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleCustomContentUpdate(content.id, 'content', e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ))}

          {customContent.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No custom content added yet.</p>
              <p className="text-sm">Click "Add Custom Section" to create your own content.</p>
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onBack}>
          Previous
        </Button>
        <Button onClick={handleNext}>Next Step</Button>
      </div>
    </div>
  );
}
