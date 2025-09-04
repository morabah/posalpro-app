'use client';

/**
 * PosalPro MVP2 - Modern Section Assignment Step
 * Built from scratch using React Query and modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ProposalSectionData, useProposalActions } from '@/lib/store/proposalStore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

interface SectionAssignmentStepProps {
  data?: ProposalSectionData;
  onNext: () => void;
  onBack: () => void;
  onUpdate?: (data: ProposalSectionData) => void;
}

// ✅ REACT HOOK FORM SCHEMA FOR SECTION ASSIGNMENT
const sectionAssignmentSchema = z.object({
  sections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
      })
    )
    .optional(),
});

type SectionAssignmentFormData = z.infer<typeof sectionAssignmentSchema>;

// Mock section templates - in real app, these would come from API
const SECTION_TEMPLATES = [
  {
    id: 'intro',
    title: 'Introduction',
    content: 'Introduction section template...',
    category: 'Overview',
  },
  {
    id: 'background',
    title: 'Background',
    content: 'Background section template...',
    category: 'Context',
  },
  {
    id: 'solution',
    title: 'Proposed Solution',
    content: 'Solution section template...',
    category: 'Technical',
  },
  {
    id: 'timeline',
    title: 'Implementation Timeline',
    content: 'Timeline section template...',
    category: 'Planning',
  },
  {
    id: 'pricing',
    title: 'Pricing & Terms',
    content: 'Pricing section template...',
    category: 'Commercial',
  },
  {
    id: 'conclusion',
    title: 'Conclusion',
    content: 'Conclusion section template...',
    category: 'Summary',
  },
];

export function SectionAssignmentStep({
  data,
  onNext,
  onBack,
  onUpdate,
}: SectionAssignmentStepProps) {
  const analytics = useOptimizedAnalytics();
  const { setStepData } = useProposalActions();

  // Local state for form data
  const [sections, setSections] = useState<ProposalSectionData['sections']>(data?.sections || []);

  // Use ref to maintain stable ID counter across re-renders
  const idCounterRef = useRef(0);

  // Initialize ID counter based on existing sections
  useEffect(() => {
    if (data?.sections && data.sections.length > 0) {
      const maxId = Math.max(
        ...data.sections.map(s => {
          const match = s.id.match(/section-(\d+)/);
          return match ? parseInt(match[1]) : -1;
        }),
        -1
      );
      idCounterRef.current = maxId + 1;
    }
  }, [data?.sections]);

  // Generate unique IDs
  const generateId = useCallback(() => {
    const newId = `section-${idCounterRef.current}`;
    idCounterRef.current += 1;
    return newId;
  }, []);

  // Handle section addition
  const handleAddSection = useCallback(() => {
    const newSection = {
      id: generateId(),
      title: '',
      content: '',
      order: sections.length + 1,
      type: 'TEXT' as const,
      isRequired: false,
    };

    setSections(prev => [...prev, newSection]);

    analytics.trackOptimized('section_added', {
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });
  }, [sections.length, analytics, generateId]);

  // Handle section update
  const handleSectionUpdate = useCallback(
    (id: string, field: 'title' | 'content', value: string) => {
      setSections(prev =>
        prev.map(section => (section.id === id ? { ...section, [field]: value } : section))
      );
    },
    []
  );

  // Handle section removal
  const handleRemoveSection = useCallback(
    (id: string) => {
      setSections(prev => prev.filter(section => section.id !== id));

      analytics.trackOptimized('section_removed', {
        sectionId: id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    },
    [analytics]
  );

  // Handle section reordering
  const handleReorderSection = useCallback((id: string, direction: 'up' | 'down') => {
    setSections(prev => {
      const currentIndex = prev.findIndex(section => section.id === id);
      if (currentIndex === -1) return prev;

      const newSections = [...prev];
      if (direction === 'up' && currentIndex > 0) {
        [newSections[currentIndex], newSections[currentIndex - 1]] = [
          newSections[currentIndex - 1],
          newSections[currentIndex],
        ];
      } else if (direction === 'down' && currentIndex < newSections.length - 1) {
        [newSections[currentIndex], newSections[currentIndex + 1]] = [
          newSections[currentIndex + 1],
          newSections[currentIndex],
        ];
      }

      // Update order numbers
      return newSections.map((section, index) => ({ ...section, order: index + 1 }));
    });
  }, []);

  // Handle template selection
  const handleAddTemplate = useCallback(
    (template: (typeof SECTION_TEMPLATES)[0]) => {
      const newSection = {
        id: generateId(),
        title: template.title,
        content: template.content,
        order: sections.length + 1,
        type: 'TEXT' as const,
        isRequired: false,
      };

      setSections(prev => [...prev, newSection]);

      analytics.trackOptimized('template_section_added', {
        templateId: template.id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
    },
    [sections.length, analytics, generateId]
  );

  // Persist sections continuously when changed
  useEffect(() => {
    setStepData(5, {
      sections,
      sectionTemplates: SECTION_TEMPLATES.map(template => ({
        id: template.id,
        title: template.title,
        content: template.content,
        category: template.category,
      })),
    });
  }, [sections, setStepData]);

  const handleNext = useCallback(() => {
    // Update store with section data
    setStepData(5, {
      sections,
      sectionTemplates: SECTION_TEMPLATES.map(template => ({
        id: template.id,
        title: template.title,
        content: template.content,
        category: template.category,
      })),
    });

    analytics.trackOptimized('proposal_step_completed', {
      step: 5,
      stepName: 'Section Assignment',
      sectionCount: sections.length,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    onNext();
  }, [sections, setStepData, analytics, onNext]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Section Assignment</h2>
        <p className="text-gray-600">
          Organize your proposal content into logical sections. Add template sections or create
          custom ones.
        </p>
      </div>

      {/* Section Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Section Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTION_TEMPLATES.map(template => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{template.title}</h4>
              <p className="text-sm text-gray-500 mb-3">{template.content.substring(0, 80)}...</p>
              <p className="text-xs text-gray-400 mb-3">Category: {template.category}</p>
              <Button variant="outline" size="sm" onClick={() => handleAddTemplate(template)}>
                Add Section
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Custom Sections */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Proposal Sections</h3>
          <Button variant="outline" onClick={handleAddSection}>
            Add Custom Section
          </Button>
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={section.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500">#{section.order}</span>
                  <Input
                    placeholder="Section Title"
                    value={section.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleSectionUpdate(section.id, 'title', e.target.value)
                    }
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReorderSection(section.id, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReorderSection(section.id, 'down')}
                    disabled={index === sections.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSection(section.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <textarea
                placeholder="Enter section content..."
                value={section.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleSectionUpdate(section.id, 'content', e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ))}

          {sections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No sections added yet.</p>
              <p className="text-sm">
                Add template sections or create custom ones to build your proposal.
              </p>
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
