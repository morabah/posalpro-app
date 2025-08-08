const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateProposalTeamAssignments() {
  try {
    console.log('🔧 Updating proposal team assignments...');

    // Get the existing proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id: 'cme1gpldb0009lp1xic2lcdzz' },
    });

    if (!proposal) {
      console.error('❌ Proposal not found');
      return;
    }

    console.log('📋 Current proposal:', proposal.title);
    console.log('📊 Current metadata:', JSON.stringify(proposal.metadata, null, 2));

    // Extract team assignments from metadata
    const metadata = proposal.metadata || {};
    const teamAssignments = metadata.teamAssignments || {};

    console.log('👥 Team assignments from metadata:', teamAssignments);

    // Get all user IDs from team assignments
    const userIds = [
      teamAssignments.teamLead,
      teamAssignments.salesRepresentative,
      ...Object.values(teamAssignments.subjectMatterExperts || {}),
    ].filter(Boolean);

    console.log('🆔 User IDs to assign:', userIds);

    if (userIds.length === 0) {
      console.log('⚠️ No team assignments found in metadata');
      return;
    }

    // Verify users exist
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    console.log(
      '✅ Found users:',
      users.map(u => ({ id: u.id, name: u.name }))
    );

    // Update proposal with team assignments
    const updatedProposal = await prisma.proposal.update({
      where: { id: 'cme1gpldb0009lp1xic2lcdzz' },
      data: {
        assignedTo: {
          connect: users.map(user => ({ id: user.id })),
        },
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    console.log('✅ Updated proposal with team assignments');
    console.log(
      '👥 Assigned team members:',
      updatedProposal.assignedTo.map(u => u.name)
    );
    console.log('📊 Total assigned:', updatedProposal.assignedTo.length);
  } catch (error) {
    console.error('❌ Error updating proposal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateProposalTeamAssignments();
