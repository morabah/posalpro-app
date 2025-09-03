#!/usr/bin/env tsx

/**
 * Outbox Drain Script
 * Processes background jobs from the outbox table
 * Run with: npm run jobs:drain or tsx scripts/outbox-drain.ts
 */

import { prisma } from "@/lib/db/prisma";
import { logInfo, logError } from "@/lib/logger";

async function main() {
  try {
    logInfo('Starting outbox drain process', {
      component: 'OutboxDrain',
      operation: 'drain_start'
    });

    // Get pending jobs, ordered by creation time (oldest first)
    const jobs = await prisma.outbox.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: 'asc' },
      take: 20 // Process in batches
    });

    logInfo(`Found ${jobs.length} pending jobs`, {
      component: 'OutboxDrain',
      operation: 'jobs_found',
      jobCount: jobs.length
    });

    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        logInfo(`Processing job ${job.id} of type ${job.type}`, {
          component: 'OutboxDrain',
          operation: 'job_processing',
          jobId: job.id,
          jobType: job.type
        });

        // Mark job as processing and increment attempts
        await prisma.outbox.update({
          where: { id: job.id },
          data: {
            status: "processing",
            attempts: { increment: 1 }
          }
        });

        // Process the job based on its type
        await processJob(job);

        // Mark job as done
        await prisma.outbox.update({
          where: { id: job.id },
          data: { status: "done" }
        });

        successful++;
        logInfo(`Job ${job.id} completed successfully`, {
          component: 'OutboxDrain',
          operation: 'job_success',
          jobId: job.id,
          jobType: job.type
        });

      } catch (error) {
        failed++;

        logError(`Job ${job.id} failed`, error, {
          component: 'OutboxDrain',
          operation: 'job_error',
          jobId: job.id,
          jobType: job.type,
          errorMessage: error instanceof Error ? error.message : String(error)
        });

        // Mark job as error
        await prisma.outbox.update({
          where: { id: job.id },
          data: { status: "error" }
        });
      }

      processed++;
    }

    logInfo('Outbox drain process completed', {
      component: 'OutboxDrain',
      operation: 'drain_complete',
      totalJobs: jobs.length,
      processedJobs: processed,
      successfulJobs: successful,
      failedJobs: failed
    });

  } catch (error) {
    logError('Outbox drain process failed', error, {
      component: 'OutboxDrain',
      operation: 'drain_error',
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    process.exit(1);
  }
}

/**
 * Process a job based on its type
 */
async function processJob(job: any) {
  switch (job.type) {
    case "email.send":
      await processEmailJob(job);
      break;

    case "pdf.generate":
      await processPdfJob(job);
      break;

    case "notification.send":
      await processNotificationJob(job);
      break;

    case "data.sync":
      await processDataSyncJob(job);
      break;

    default:
      logInfo(`Unknown job type: ${job.type}`, {
        component: 'OutboxDrain',
        operation: 'unknown_job_type',
        jobType: job.type,
        jobId: job.id
      });
      // Unknown job types are not considered errors
      break;
  }
}

/**
 * Process email sending job
 */
async function processEmailJob(job: any) {
  const { to, subject, body, attachments } = job.payload;

  // Simulate email sending
  logInfo(`Sending email to ${to}`, {
    component: 'OutboxDrain',
    operation: 'email_send',
    recipient: to,
    subject: subject
  });

  // Here you would integrate with your email service (SendGrid, SES, etc.)
  // For now, just simulate success
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
}

/**
 * Process PDF generation job
 */
async function processPdfJob(job: any) {
  const { template, data, filename } = job.payload;

  logInfo(`Generating PDF: ${filename}`, {
    component: 'OutboxDrain',
    operation: 'pdf_generate',
    template: template,
    filename: filename
  });

  // Here you would integrate with PDF generation service
  // For now, just simulate success
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate processing time
}

/**
 * Process notification job
 */
async function processNotificationJob(job: any) {
  const { userId, type, message } = job.payload;

  logInfo(`Sending notification to user ${userId}`, {
    component: 'OutboxDrain',
    operation: 'notification_send',
    userId: userId,
    notificationType: type
  });

  // Here you would integrate with push notification service
  // For now, just simulate success
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate processing time
}

/**
 * Process data synchronization job
 */
async function processDataSyncJob(job: any) {
  const { source, target, data } = job.payload;

  logInfo(`Synchronizing data from ${source} to ${target}`, {
    component: 'OutboxDrain',
    operation: 'data_sync',
    source: source,
    target: target
  });

  // Here you would implement data synchronization logic
  // For now, just simulate success
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate processing time
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logInfo('Outbox drain process interrupted', {
    component: 'OutboxDrain',
    operation: 'shutdown'
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  logInfo('Outbox drain process terminated', {
    component: 'OutboxDrain',
    operation: 'shutdown'
  });
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    logError('Unhandled error in outbox drain', error, {
      component: 'OutboxDrain',
      operation: 'unhandled_error'
    });
    process.exit(1);
  });
}
