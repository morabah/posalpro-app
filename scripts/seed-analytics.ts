/**
 * PosalPro MVP2 - Analytics Data Seeding Script
 * Seeds sample analytics data for hypothesis validation testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HYPOTHESES = ['H1', 'H3', 'H4', 'H6', 'H7', 'H8'] as const;
const USER_STORIES = [
  'US-1.1',
  'US-1.2',
  'US-1.3', // H1
  'US-2.1',
  'US-2.2',
  'US-2.3', // H3, H4
  'US-3.1',
  'US-3.2',
  'US-3.3', // H8
  'US-4.1',
  'US-4.2',
  'US-4.3', // H6, H7
];

const COMPONENTS = [
  'ContentSearchEngine',
  'SMEContributionForm',
  'CoordinationHub',
  'RequirementExtractor',
  'TimelineManager',
  'ValidationEngine',
];

async function seedAnalyticsData() {
  console.log('🌱 Seeding analytics data...');

  try {
    // Get or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'admin@posalpro.com' },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'admin@posalpro.com',
          name: 'Analytics Admin',
          password: 'hashed_password',
          department: 'Engineering',
        },
      });
    }

    // 1. Create User Story Metrics
    console.log('📊 Creating user story metrics...');
    for (const userStoryId of USER_STORIES) {
      await prisma.userStoryMetrics.upsert({
        where: { userStoryId },
        update: {},
        create: {
          userStoryId,
          hypothesis: getHypothesesForUserStory(userStoryId),
          acceptanceCriteria: [`AC-${userStoryId}.1`, `AC-${userStoryId}.2`, `AC-${userStoryId}.3`],
          performanceTargets: {
            response_time: 2000,
            accuracy: 95,
            user_satisfaction: 4.5,
          },
          actualPerformance: {
            response_time: Math.random() * 1500 + 500,
            accuracy: Math.random() * 10 + 90,
            user_satisfaction: Math.random() * 1 + 4,
          },
          completionRate: Math.random() * 0.4 + 0.6, // 60-100%
          passedCriteria: [`AC-${userStoryId}.1`, `AC-${userStoryId}.2`],
          failedCriteria: Math.random() > 0.8 ? [`AC-${userStoryId}.3`] : [],
          baselineMetrics: {
            initial_response_time: 3000,
            initial_accuracy: 80,
            initial_satisfaction: 3.5,
          },
        },
      });
    }

    // 2. Create Performance Baselines
    console.log('📈 Creating performance baselines...');
    const baselineData = [
      {
        hypothesis: 'H1',
        metric: 'Search Time',
        baseline: 7.0,
        current: 3.8,
        unit: 'seconds',
        target: 0.45,
      },
      {
        hypothesis: 'H1',
        metric: 'Result Relevance',
        baseline: 72,
        current: 92.5,
        unit: 'percentage',
        target: 0.25,
      },
      {
        hypothesis: 'H3',
        metric: 'Contribution Time',
        baseline: 4.5,
        current: 1.9,
        unit: 'hours',
        target: 0.5,
      },
      {
        hypothesis: 'H4',
        metric: 'Coordination Effort',
        baseline: 2.8,
        current: 1.8,
        unit: 'hours',
        target: 0.4,
      },
      {
        hypothesis: 'H6',
        metric: 'Extraction Accuracy',
        baseline: 78,
        current: 94.2,
        unit: 'percentage',
        target: 0.3,
      },
      {
        hypothesis: 'H7',
        metric: 'On-time Completion',
        baseline: 65,
        current: 88,
        unit: 'percentage',
        target: 0.4,
      },
      {
        hypothesis: 'H8',
        metric: 'Validation Errors',
        baseline: 23,
        current: 14,
        unit: 'errors',
        target: 0.5,
      },
    ];

    for (const baseline of baselineData) {
      const improvement = calculateImprovement(
        baseline.baseline,
        baseline.current,
        baseline.hypothesis
      );

      await prisma.performanceBaseline.create({
        data: {
          hypothesis: baseline.hypothesis,
          metricName: baseline.metric,
          baselineValue: baseline.baseline,
          targetImprovement: baseline.target,
          currentValue: baseline.current,
          improvementPercentage: improvement,
          measurementUnit: baseline.unit,
          sampleSize: Math.floor(Math.random() * 400) + 100,
          confidence: Math.random() * 0.15 + 0.85, // 85-100%
          environment: 'development',
          methodology: 'Automated measurement with statistical validation',
        },
      });
    }

    // 3. Create Component Traceability
    console.log('🔗 Creating component traceability...');
    for (const componentName of COMPONENTS) {
      const relatedUserStories = USER_STORIES.filter(() => Math.random() > 0.6);
      const relatedHypotheses = HYPOTHESES.filter(() => Math.random() > 0.5);

      await prisma.componentTraceability.upsert({
        where: { componentName },
        update: {},
        create: {
          componentName,
          userStories: relatedUserStories,
          acceptanceCriteria: relatedUserStories.flatMap(us => [`AC-${us}.1`, `AC-${us}.2`]),
          methods: [
            `${componentName.toLowerCase()}Method()`,
            `validate${componentName}()`,
            `track${componentName}Analytics()`,
          ],
          hypotheses: relatedHypotheses,
          testCases: relatedHypotheses.map(h => `TC-${h}-001`),
          analyticsHooks: [`use${componentName}Analytics`, `track${componentName}Event`],
          validationStatus: Math.random() > 0.8 ? 'NEEDS_REVIEW' : 'VALID',
        },
      });
    }

    // 4. Create Hypothesis Validation Events
    console.log('⚡ Creating hypothesis validation events...');
    for (let i = 0; i < 200; i++) {
      const hypothesis = HYPOTHESES[Math.floor(Math.random() * HYPOTHESES.length)];
      const userStoryId = USER_STORIES[Math.floor(Math.random() * USER_STORIES.length)];
      const componentId = COMPONENTS[Math.floor(Math.random() * COMPONENTS.length)];

      const targetValue = Math.random() * 50 + 30; // 30-80
      const actualValue = Math.random() * 60 + 20; // 20-80
      const improvement = ((actualValue - targetValue) / targetValue) * 100;

      await prisma.hypothesisValidationEvent.create({
        data: {
          userId: testUser.id,
          userRole: 'admin',
          hypothesis: hypothesis as any,
          userStoryId,
          componentId,
          action: getRandomAction(),
          measurementData: {
            startTime: Date.now() - Math.random() * 5000,
            endTime: Date.now(),
            environment: 'test',
            sampleSize: Math.floor(Math.random() * 100) + 10,
          },
          targetValue,
          actualValue,
          performanceImprovement: improvement,
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          testCaseId: `TC-${hypothesis}-${String(Math.floor(Math.random() * 3) + 1).padStart(3, '0')}`,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      });
    }

    console.log('✅ Analytics data seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${USER_STORIES.length} user story metrics`);
    console.log(`   - ${baselineData.length} performance baselines`);
    console.log(`   - ${COMPONENTS.length} component traceability records`);
    console.log(`   - 200 hypothesis validation events`);
  } catch (error) {
    console.error('❌ Error seeding analytics data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getHypothesesForUserStory(userStoryId: string): string[] {
  const mapping: Record<string, string[]> = {
    'US-1.1': ['H1'],
    'US-1.2': ['H1'],
    'US-1.3': ['H1'],
    'US-2.1': ['H3'],
    'US-2.2': ['H4'],
    'US-2.3': ['H4'],
    'US-3.1': ['H8'],
    'US-3.2': ['H8'],
    'US-3.3': ['H8'],
    'US-4.1': ['H7'],
    'US-4.2': ['H6'],
    'US-4.3': ['H7'],
  };
  return mapping[userStoryId] || ['H1'];
}

function calculateImprovement(baseline: number, current: number, hypothesis: string): number {
  const lowerIsBetter = ['H1', 'H3', 'H4', 'H8'].includes(hypothesis);

  if (lowerIsBetter) {
    return ((baseline - current) / baseline) * 100;
  } else {
    return ((current - baseline) / baseline) * 100;
  }
}

function getRandomAction(): string {
  const actions = [
    'search_content',
    'create_proposal',
    'validate_configuration',
    'coordinate_team',
    'extract_requirements',
    'manage_timeline',
    'contribute_expertise',
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

// Run the seeding
if (require.main === module) {
  seedAnalyticsData()
    .then(() => {
      console.log('🎉 Analytics seeding completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedAnalyticsData;
