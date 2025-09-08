# Outbox Pattern Implementation Guide

## 🎯 **Overview**

The Outbox pattern enables reliable background processing without complex infrastructure. It stores jobs in the database and processes them via CLI commands.

## 🗄️ **Database Schema**

### **Outbox Table Structure**
```prisma
model Outbox {
  id        String   @id @default(cuid())
  type      String   // Job type (email.send, pdf.generate, etc.)
  payload   Json     // Job data
  status    String   @default("pending")  // pending, processing, done, error
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  attempts  Int      @default(0)  // Retry counter

  @@index([status])
  @@index([createdAt])
  @@index([type])
  @@index([status, createdAt])
}
```

## 🚀 **Quick Start**

### **1. Add a Job to the Outbox**
```typescript
import { prisma } from "@/lib/db/prisma";

await prisma.outbox.create({
  data: {
    type: "email.send",
    payload: {
      to: "user@example.com",
      subject: "Welcome!",
      body: "Welcome to our platform..."
    }
  }
});
```

### **2. Process Jobs via CLI**
```bash
# Run the drain command
npm run app:cli jobs:drain

# Or run directly
tsx scripts/outbox-drain.ts
```

## 📋 **Supported Job Types**

### **Email Jobs**
```typescript
{
  type: "email.send",
  payload: {
    to: "user@example.com",
    subject: "Subject",
    body: "Message body",
    attachments: [] // Optional
  }
}
```

### **PDF Generation**
```typescript
{
  type: "pdf.generate",
  payload: {
    template: "proposal",
    data: { proposalId: "123" },
    filename: "proposal-123.pdf"
  }
}
```

### **Notifications**
```typescript
{
  type: "notification.send",
  payload: {
    userId: "user-123",
    type: "proposal_approved",
    message: "Your proposal has been approved"
  }
}
```

### **Data Synchronization**
```typescript
{
  type: "data.sync",
  payload: {
    source: "api",
    target: "database",
    data: { /* sync data */ }
  }
}
```

## 🔧 **Adding New Job Types**

### **1. Add Job Processing Logic**
```typescript
// In scripts/outbox-drain.ts
async function processJob(job: any) {
  switch (job.type) {
    case "your.new.job":
      await processYourNewJob(job);
      break;
    // ... existing cases
  }
}

async function processYourNewJob(job: any) {
  const { param1, param2 } = job.payload;

  // Your job processing logic here
  logInfo(`Processing new job: ${job.id}`, {
    component: 'OutboxDrain',
    operation: 'new_job_processing',
    jobId: job.id
  });

  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### **2. Create Jobs in Your Code**
```typescript
import { prisma } from "@/lib/db/prisma";

export async function queueYourJob(data: YourJobData) {
  await prisma.outbox.create({
    data: {
      type: "your.new.job",
      payload: data
    }
  });
}
```

## 📊 **Monitoring & Analytics**

### **Check Job Status**
```typescript
// Count jobs by status
const pendingCount = await prisma.outbox.count({
  where: { status: "pending" }
});

const processingCount = await prisma.outbox.count({
  where: { status: "processing" }
});

const failedCount = await prisma.outbox.count({
  where: { status: "error" }
});
```

### **View Recent Jobs**
```typescript
const recentJobs = await prisma.outbox.findMany({
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

### **Retry Failed Jobs**
```typescript
// Reset failed jobs for retry
await prisma.outbox.updateMany({
  where: {
    status: "error",
    attempts: { lt: 3 } // Max 3 attempts
  },
  data: { status: "pending" }
});
```

## 🛠️ **CLI Commands**

### **Process Jobs**
```bash
# Via CLI
npm run app:cli jobs:drain

# Direct execution
tsx scripts/outbox-drain.ts
```

### **Check System Health**
```bash
# Database health
npm run app:cli health:db

# API health
npm run app:cli health:api
```

## 📈 **Performance Considerations**

### **Batch Processing**
- Processes jobs in batches of 20
- Ordered by creation time (oldest first)
- Graceful error handling per job

### **Indexing Strategy**
```prisma
@@index([status])           // Fast status queries
@@index([createdAt])        // Time-based ordering
@@index([type])            // Job type filtering
@@index([status, createdAt]) // Combined queries
```

### **Retry Logic**
- Automatic retry counter
- Max attempts tracking
- Failed job isolation

## 🔍 **Troubleshooting**

### **Check Job Status**
```bash
# View pending jobs
npm run app:cli db outbox findMany '{"where":{"status":"pending"},"take":5}'

# View failed jobs
npm run app:cli db outbox findMany '{"where":{"status":"error"},"take":5}'
```

### **Monitor Processing**
```bash
# Watch logs during processing
npm run app:cli jobs:drain
```

### **Clean Up Old Jobs**
```bash
# Remove old completed jobs (older than 30 days)
npm run app:cli db outbox deleteMany '{"where":{"status":"done","createdAt":{"lt":"2024-01-01T00:00:00Z"}}}'
```

## 🎯 **Best Practices**

### **✅ Do's**
- ✅ Use descriptive job types
- ✅ Include all necessary data in payload
- ✅ Handle job failures gracefully
- ✅ Monitor job processing metrics
- ✅ Clean up old completed jobs

### **❌ Don'ts**
- ❌ Store large payloads (>1MB)
- ❌ Assume job order (process async)
- ❌ Block main application flow
- ❌ Retry indefinitely
- ❌ Skip error logging

## 📚 **Integration Examples**

### **API Route Integration**
```typescript
// POST /api/proposals
export async function POST(request: Request) {
  const data = await request.json();

  // Create proposal
  const proposal = await prisma.proposal.create({ data });

  // Queue background jobs
  await prisma.outbox.create({
    data: {
      type: "email.send",
      payload: {
        to: proposal.customerEmail,
        subject: "Proposal Created",
        body: `Your proposal ${proposal.id} has been created`
      }
    }
  });

  return Response.json(proposal);
}
```

### **Service Layer Integration**
```typescript
class ProposalService {
  async createProposal(data: CreateProposalData) {
    // Create proposal
    const proposal = await prisma.proposal.create({ data });

    // Queue notification
    await this.queueNotification(proposal);

    // Queue PDF generation
    await this.queuePdfGeneration(proposal);

    return proposal;
  }

  private async queueNotification(proposal: Proposal) {
    await prisma.outbox.create({
      data: {
        type: "notification.send",
        payload: {
          userId: proposal.userId,
          type: "proposal_created",
          message: `Proposal ${proposal.id} created successfully`
        }
      }
    });
  }
}
```

## 🚀 **Production Deployment**

### **Cron Job Setup**
```bash
# Run every 5 minutes
*/5 * * * * cd /path/to/app && npm run app:cli jobs:drain
```

### **Health Monitoring**
```bash
# Check for stuck jobs (processing > 10 minutes)
npm run app:cli db outbox findMany '{"where":{"status":"processing","updatedAt":{"lt":"2024-01-01T00:00:00Z"}}}'
```

### **Performance Monitoring**
```bash
# Track job processing rates
npm run app:cli db outbox aggregate '{"where":{"createdAt":{"gte":"2024-01-01T00:00:00Z"}},"_count":{"id":true}}'
```

---

**🎉 Your outbox pattern is ready for background processing!**

**Quick commands:**
- **Add jobs:** `prisma.outbox.create({ type: "email.send", payload: {...} })`
- **Process jobs:** `npm run app:cli jobs:drain`
- **Monitor:** `npm run app:cli db outbox findMany '{"take":5}'`
