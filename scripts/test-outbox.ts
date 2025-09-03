#!/usr/bin/env tsx

/**
 * Test Outbox Pattern - Add Sample Jobs
 * Run with: tsx scripts/test-outbox.ts
 */

import { prisma } from "@/lib/db/prisma";
import { logInfo } from "@/lib/logger";

async function main() {
  try {
    logInfo('Creating sample outbox jobs', {
      component: 'TestOutbox',
      operation: 'create_sample_jobs'
    });

    // Create sample email job
    const emailJob = await prisma.outbox.create({
      data: {
        type: "email.send",
        payload: {
          to: "test@example.com",
          subject: "Test Email from Outbox",
          body: "This is a test email sent via the outbox pattern!",
          attachments: []
        }
      }
    });

    // Create sample PDF job
    const pdfJob = await prisma.outbox.create({
      data: {
        type: "pdf.generate",
        payload: {
          template: "test-template",
          data: { testId: "12345" },
          filename: "test-document.pdf"
        }
      }
    });

    // Create sample notification job
    const notificationJob = await prisma.outbox.create({
      data: {
        type: "notification.send",
        payload: {
          userId: "user-test-123",
          type: "test_notification",
          message: "This is a test notification from the outbox pattern"
        }
      }
    });

    // Create sample data sync job
    const syncJob = await prisma.outbox.create({
      data: {
        type: "data.sync",
        payload: {
          source: "test-api",
          target: "test-database",
          data: { sampleData: "test-value" }
        }
      }
    });

    logInfo('Sample jobs created successfully', {
      component: 'TestOutbox',
      operation: 'jobs_created',
      emailJobId: emailJob.id,
      pdfJobId: pdfJob.id,
      notificationJobId: notificationJob.id,
      syncJobId: syncJob.id
    });

    console.log('\n✅ Sample jobs created!');
    console.log(`📧 Email job: ${emailJob.id}`);
    console.log(`📄 PDF job: ${pdfJob.id}`);
    console.log(`🔔 Notification job: ${notificationJob.id}`);
    console.log(`🔄 Sync job: ${syncJob.id}`);

    console.log('\n🚀 Run the following to process these jobs:');
    console.log('npm run app:cli jobs:drain');

    console.log('\n📊 Check job status:');
    console.log('npm run app:cli db outbox findMany \'{"take":5}\'');

  } catch (error) {
    logError('Failed to create sample jobs', error, {
      component: 'TestOutbox',
      operation: 'create_jobs_failed',
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

// Import logError
import { logError } from "@/lib/logger";

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
