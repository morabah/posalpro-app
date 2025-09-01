const { PrismaClient } = require('@prisma/client');

async function checkProposal() {
  console.log('🔍 CHECKING PROPOSAL EXISTENCE');
  console.log('==============================\\n');

  const prisma = new PrismaClient();

  try {
    const proposalId = 'cmf0r4nhu003fjr10acbdosf7';

    console.log('📋 Checking proposal:', proposalId);

    // Check if proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        _count: {
          select: { versions: true }
        }
      }
    });

    if (!proposal) {
      console.log('❌ Proposal does not exist');
      return;
    }

    console.log('✅ Proposal exists:', {
      id: proposal.id,
      title: proposal.title,
      status: proposal.status,
      createdAt: proposal.createdAt,
      versionsCount: proposal._count.versions
    });

    // Check versions
    if (proposal._count.versions > 0) {
      console.log('\\n📋 Checking versions...');
      const versions = await prisma.proposalVersion.findMany({
        where: { proposalId },
        select: {
          id: true,
          version: true,
          changeType: true,
          changesSummary: true,
          createdAt: true
        },
        orderBy: { version: 'desc' },
        take: 3
      });

      console.log('📄 Versions found:', versions.length);
      versions.forEach(v => {
        console.log(`  - Version ${v.version}: ${v.changeType} (${v.createdAt.toISOString()})`);
        console.log(`    Summary: ${v.changesSummary || 'No summary'}`);
      });
    } else {
      console.log('⚠️  No versions found for this proposal');
    }

  } catch (error) {
    console.log('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProposal();
