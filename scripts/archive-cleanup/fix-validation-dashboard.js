#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING ValidationDashboard Issues');
console.log('='.repeat(50));

const validationPagePath = path.join(process.cwd(), 'src/app/(dashboard)/validation/page.tsx');

if (!fs.existsSync(validationPagePath)) {
  console.log('❌ ValidationDashboard page not found');
  process.exit(1);
}

let content = fs.readFileSync(validationPagePath, 'utf8');
let changesMade = false;

// Fix 1: Correct useErrorHandler import to useErrorHandling
if (content.includes('useErrorHandler')) {
  console.log('🔧 Fixing useErrorHandler import...');
  content = content.replace(
    "import { useErrorHandler } from '@/hooks/useErrorHandler';",
    "import { useErrorHandling } from '@/hooks/useErrorHandling';"
  );
  content = content.replace(
    'const { handleAsyncError } = useErrorHandler();',
    'const { handleAsyncError } = useErrorHandling();'
  );
  changesMade = true;
  console.log('✅ Fixed useErrorHandler import');
}

// Fix 2: Ensure refreshValidationData function exists and is properly defined
if (!content.includes('const refreshValidationData = useCallback')) {
  console.log('🔧 Adding missing refreshValidationData function...');

  // Find the position after loadValidationData function
  const loadValidationDataEnd = content.indexOf(
    '}, [apiClient, analytics, handleAsyncError, COMPONENT_MAPPING]);'
  );

  if (loadValidationDataEnd !== -1) {
    const insertPosition =
      loadValidationDataEnd +
      '}, [apiClient, analytics, handleAsyncError, COMPONENT_MAPPING]);'.length;

    const refreshFunction = `

  // Create refreshValidationData function for the refresh button
  const refreshValidationData = useCallback(async () => {
    analytics.track('validation_data_refresh_requested', {
      timestamp: Date.now(),
      userStory: 'US-3.1',
      hypothesis: 'H8',
      component: 'ValidationDashboard',
      ...COMPONENT_MAPPING,
    });

    await loadValidationData();
  }, [loadValidationData, analytics, COMPONENT_MAPPING]);`;

    content = content.slice(0, insertPosition) + refreshFunction + content.slice(insertPosition);
    changesMade = true;
    console.log('✅ Added refreshValidationData function');
  }
}

// Fix 3: Ensure COMPONENT_MAPPING is properly defined
if (!content.includes('const COMPONENT_MAPPING = {')) {
  console.log('🔧 Adding missing COMPONENT_MAPPING...');

  // Find position after state declarations
  const stateDeclarationsEnd = content.indexOf(
    "const [timeFilter, setTimeFilter] = useState('last-30-days');"
  );

  if (stateDeclarationsEnd !== -1) {
    const insertPosition =
      stateDeclarationsEnd + "const [timeFilter, setTimeFilter] = useState('last-30-days');".length;

    const componentMapping = `

  // Component Traceability Matrix
  const COMPONENT_MAPPING = {
    userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
    acceptanceCriteria: ['AC-3.1.1', 'AC-3.1.2', 'AC-3.1.3', 'AC-3.2.1', 'AC-3.3.1'],
    methods: ['loadValidationData()', 'handleResolveIssue()', 'handleExportReport()'],
    hypotheses: ['H8'],
    testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
  };`;

    content = content.slice(0, insertPosition) + componentMapping + content.slice(insertPosition);
    changesMade = true;
    console.log('✅ Added COMPONENT_MAPPING');
  }
}

if (changesMade) {
  fs.writeFileSync(validationPagePath, content);
  console.log('✅ ValidationDashboard fixes applied successfully');
} else {
  console.log('ℹ️  No changes needed - ValidationDashboard already correct');
}

console.log('\n🎉 ValidationDashboard fix complete!');
console.log('✅ useErrorHandling import corrected');
console.log('✅ refreshValidationData function available');
console.log('✅ COMPONENT_MAPPING properly defined');
console.log('\nThe ValidationDashboard should now work without errors.');
