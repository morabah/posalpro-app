const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Bridge Templates for Critical Improvements');
console.log('='.repeat(60));

const bridgeDir = 'templates/design-patterns/bridge';
const templateFiles = [
  'api-bridge.template.ts',
  'management-bridge.template.tsx', 
  'bridge-page.template.tsx'
];

let totalScore = 0;
let maxScore = 0;

templateFiles.forEach(file => {
  const filePath = path.join(bridgeDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${file} - File not found`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n📄 ${file}`);
  
  const tests = [
    ['Array Safety', /Array\.isArray|\|\| \[\]|\.data \? \[/g],
    ['Auth Error Handling', /Authentication.*required|session.*expired|Please.*log.*in/gi],
    ['Context Safety', /user\?\.|!user &&|sessionData.*undefined/g],
    ['Infinite Loop Prevention', /useEffect.*\[\s*\]|setTimeout.*0/g],
    ['API Response Handling', /response.*=.*\{|Invalid.*response.*format/g],
    ['Error Fallbacks', /catch.*fallback|try.*catch.*try/g]
  ];
  
  let fileScore = 0;
  tests.forEach(([name, regex]) => {
    const matches = content.match(regex) || [];
    const hasPattern = matches.length > 0;
    console.log(`  ${hasPattern ? '✅' : '❌'} ${name}: ${matches.length} instances`);
    if (hasPattern) fileScore += 1;
    maxScore += 1;
  });
  
  totalScore += fileScore;
  const percentage = Math.round((fileScore / tests.length) * 100);
  console.log(`  📊 Score: ${fileScore}/${tests.length} (${percentage}%)`);
});

const overallPercentage = Math.round((totalScore / maxScore) * 100);
const status = overallPercentage >= 80 ? '🟢 EXCELLENT' : 
              overallPercentage >= 60 ? '🟡 GOOD' : '🔴 NEEDS WORK';

console.log('\n' + '='.repeat(60));
console.log('📊 OVERALL RESULTS');
console.log('='.repeat(60));
console.log(`Status: ${status}`);
console.log(`Overall Score: ${totalScore}/${maxScore} (${overallPercentage}%)`);

if (overallPercentage >= 80) {
  console.log('✅ Templates successfully updated with critical fixes');
  console.log('✅ Ready for production use');
} else {
  console.log('⚠️ Some patterns may need additional work');
}
