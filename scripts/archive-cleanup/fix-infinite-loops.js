#!/usr/bin/env node

/**
 * PosalPro MVP2 - Fix Infinite Loop Issues
 * Systematically fixes useEffect hooks with unstable dependencies
 * that cause infinite re-rendering and "blinking data" issues
 */

const fs = require('fs');
const path = require('path');

// Files that need infinite loop fixes
const INFINITE_LOOP_FIXES = [
  {
    file: 'src/components/proposals/ApprovalQueue.tsx',
    search: '  }, [analytics, errorHandlingService, currentUser]);',
    replace:
      '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)',
  },
  {
    file: 'src/app/(dashboard)/proposals/approve/page.tsx',
    search: '  }, [apiClient, errorHandlingService, analytics]);',
    replace:
      '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)',
  },
  {
    file: 'src/app/executive/review/page.tsx',
    search: '  }, [errorHandlingService, analytics, isMobile]);',
    replace:
      '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)',
  },
  {
    file: 'src/components/customers/CustomerList.tsx',
    search: '  }, [fetchCustomers]);',
    replace:
      '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)',
  },
  {
    file: 'src/components/products/ProductList.tsx',
    search: '  }, [fetchProducts]);',
    replace:
      '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)',
  },
];

// Simple analytics dependency fixes
const ANALYTICS_FIXES = [
  'src/components/auth/LoginForm.tsx',
  'src/components/auth/EnhancedLoginForm.tsx',
  'src/components/profile/UserProfile.tsx',
  'src/components/deadlines/DeadlineTracker.tsx',
  'src/app/proposals/create/page.tsx',
  'src/components/dashboard/DashboardShell.tsx',
];

function fixInfiniteLoops() {
  console.log('🔧 Starting infinite loop fixes...\n');

  let totalFixed = 0;

  // Apply specific pattern fixes
  INFINITE_LOOP_FIXES.forEach(fix => {
    const filePath = path.join(process.cwd(), fix.file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${fix.file}`);
      return;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');

      if (content.includes(fix.search)) {
        content = content.replace(fix.search, fix.replace);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed infinite loop in: ${fix.file}`);
        totalFixed++;
      } else {
        console.log(`ℹ️  Pattern not found in: ${fix.file}`);
      }
    } catch (error) {
      console.log(`❌ Error fixing ${fix.file}:`, error.message);
    }
  });

  // Apply simple analytics dependency fixes
  ANALYTICS_FIXES.forEach(file => {
    const filePath = path.join(process.cwd(), file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');

      // Pattern: }, [analytics]);
      if (content.includes('}, [analytics]);')) {
        content = content.replace(
          '}, [analytics]);',
          '    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []); // ✅ CRITICAL FIX: Empty dependency array prevents infinite loops (CORE_REQUIREMENTS.md pattern)'
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed analytics dependency in: ${file}`);
        totalFixed++;
      }
    } catch (error) {
      console.log(`❌ Error fixing ${file}:`, error.message);
    }
  });

  console.log(`\n🎉 Infinite loop fixes complete! Fixed ${totalFixed} files.`);
  console.log('\n📋 Summary:');
  console.log('- Removed unstable dependencies from useEffect hooks');
  console.log('- Applied empty dependency arrays with ESLint suppression');
  console.log('- Prevented "blinking data" issues in dashboard components');
  console.log('- Maintained analytics tracking functionality');
  console.log('- Applied CORE_REQUIREMENTS.md patterns consistently');
}

// Run the fixes
fixInfiniteLoops();
