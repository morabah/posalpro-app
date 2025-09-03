const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function testEyeIconFunctionality() {
  console.log('👁️  TESTING EYE ICON FUNCTIONALITY');
  console.log('=====================================\n');

  const prisma = new PrismaClient();

  try {
    // Step 1: Find a proposal with versions
    console.log('📋 Step 1: Finding proposal with versions...');
    const proposalWithVersions = await prisma.proposal.findFirst({
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 2
        }
      }
    });

    if (!proposalWithVersions || proposalWithVersions.versions.length < 2) {
      console.log('❌ No proposals with multiple versions found');
      console.log('💡 To test eye icon: First create a proposal, then modify products and save to create versions');
      return;
    }

    const proposal = proposalWithVersions;
    const latestVersion = proposal.versions[0];
    const previousVersion = proposal.versions[1];

    console.log(`✅ Found proposal: ${proposal.title}`);
    console.log(`   Latest version: ${latestVersion.version}`);
    console.log(`   Previous version: ${previousVersion.version}\n`);

    // Step 2: Test the API endpoint that the eye icon calls
    console.log('🔍 Step 2: Testing version detail API (what eye icon calls)...');

    const baseUrl = 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/proposals/${proposal.id}/versions?version=${latestVersion.version}&detail=1`;

    console.log(`   Calling: ${apiUrl}`);

    try {
      const curlCommand = `curl -s "${apiUrl}" -H "Content-Type: application/json"`;
      const result = execSync(curlCommand, { encoding: 'utf8' });

      console.log('   ✅ API call successful');

      const parsed = JSON.parse(result);
      console.log('   Response structure:');
      console.log(`     - Has data: ${!!parsed.data}`);
      console.log(`     - Has diff: ${!!parsed.data?.diff}`);
      console.log(`     - Added products: ${parsed.data?.diff?.added?.length || 0}`);
      console.log(`     - Removed products: ${parsed.data?.diff?.removed?.length || 0}`);
      console.log(`     - Updated products: ${parsed.data?.diff?.updated?.length || 0}`);
      console.log(`     - Has productsMap: ${!!parsed.data?.productsMap}`);
      console.log(`     - Total value: ${parsed.data?.totalValue || 'N/A'}`);

      if (parsed.data?.diff) {
        console.log('\n🎉 SUCCESS: Eye icon will show detailed changes!');
        console.log('   The diff data is available and properly formatted.');
      } else {
        console.log('\n⚠️  WARNING: No diff data found');
        console.log('   The eye icon may show basic info instead of detailed changes.');
      }

    } catch (curlError) {
      console.log('   ❌ API call failed:', curlError.message);
      console.log('   💡 Make sure the development server is running');
    }

    // Step 3: Instructions for manual testing
    console.log('\n📋 Step 3: Manual testing instructions:');
    console.log('   1. Go to http://localhost:3000/proposals/version-history');
    console.log(`   2. Find proposal: "${proposal.title}"`);
    console.log('   3. Click the eye icon (👁️) next to any version');
    console.log('   4. You should see what changed in that version');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEyeIconFunctionality().catch(console.error);
