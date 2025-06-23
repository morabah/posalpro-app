#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

console.log('🧪 Simple Database Performance Validation');
console.log('=========================================\n');

async function runSimpleTests() {
  const prisma = new PrismaClient();

  try {
    console.log('📊 Testing basic database operations...\n');

    // Test 1: Content search performance
    console.log('1. Testing content search...');
    const startTime1 = Date.now();
    const contentResults = await prisma.content.findMany({
      where: {
        OR: [
          { title: { contains: 'proposal', mode: 'insensitive' } },
          { description: { contains: 'proposal', mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
    const endTime1 = Date.now();
    console.log(`   ✅ Found ${contentResults.length} content items in ${endTime1 - startTime1}ms`);

    // Test 2: Proposal query performance
    console.log('2. Testing proposal queries...');
    const startTime2 = Date.now();
    const proposalResults = await prisma.proposal.findMany({
      where: {
        status: 'IN_REVIEW',
      },
      include: {
        customer: true,
      },
      take: 10,
    });
    const endTime2 = Date.now();
    console.log(`   ✅ Found ${proposalResults.length} proposals in ${endTime2 - startTime2}ms`);

    // Test 3: Product search performance
    console.log('3. Testing product search...');
    const startTime3 = Date.now();
    const productResults = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      take: 10,
    });
    const endTime3 = Date.now();
    console.log(`   ✅ Found ${productResults.length} products in ${endTime3 - startTime3}ms`);

    // Test 4: Analytics query performance
    console.log('4. Testing analytics queries...');
    const startTime4 = Date.now();
    const analyticsResults = await prisma.hypothesisValidationEvent.findMany({
      where: {
        hypothesis: 'H8',
      },
      take: 10,
    });
    const endTime4 = Date.now();
    console.log(
      `   ✅ Found ${analyticsResults.length} analytics events in ${endTime4 - startTime4}ms`
    );

    // Test 5: User session query (RBAC)
    console.log('5. Testing RBAC queries...');
    const startTime5 = Date.now();
    const sessionResults = await prisma.userSession.findMany({
      where: {
        isActive: true,
      },
      take: 10,
    });
    const endTime5 = Date.now();
    console.log(
      `   ✅ Found ${sessionResults.length} active sessions in ${endTime5 - startTime5}ms`
    );

    // Performance summary
    const totalTime =
      endTime1 -
      startTime1 +
      (endTime2 - startTime2) +
      (endTime3 - startTime3) +
      (endTime4 - startTime4) +
      (endTime5 - startTime5);
    const averageTime = totalTime / 5;

    console.log('\n📈 Performance Summary:');
    console.log(`   Total test time: ${totalTime}ms`);
    console.log(`   Average per test: ${averageTime.toFixed(2)}ms`);

    // Performance evaluation
    if (averageTime < 200) {
      console.log('   🎉 EXCELLENT performance! (< 200ms average)');
    } else if (averageTime < 500) {
      console.log('   ✅ GOOD performance! (< 500ms average)');
    } else if (averageTime < 1000) {
      console.log('   ⚠️  ACCEPTABLE performance (< 1000ms average)');
    } else {
      console.log('   ❌ POOR performance (> 1000ms average)');
    }

    // Hypothesis validation
    console.log('\n🔬 Hypothesis Validation:');
    console.log('   H8 (Database Query Response): Target < 200ms per query');
    console.log(`   H8 Result: ${averageTime < 200 ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}`);
    console.log('   H11 (Search Performance): Target < 240ms for search queries');
    const searchAverage = (endTime1 - startTime1 + (endTime3 - startTime3)) / 2;
    console.log(`   H11 Result: ${searchAverage < 240 ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}`);
    console.log('   H12 (Analytics Speed): Target < 150ms for analytics');
    console.log(
      `   H12 Result: ${endTime4 - startTime4 < 150 ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}`
    );

    console.log('\n✅ Database performance validation completed!');
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runSimpleTests()
  .then(() => {
    console.log('\n🎉 All database tests completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Database testing failed:', error);
    process.exit(1);
  });
