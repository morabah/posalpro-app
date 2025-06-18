# Database Performance Optimization Plan

## 🎯 Current State Analysis

**Strengths**:

- Comprehensive indexing already implemented (50+ indexes)
- Well-designed foreign key relationships
- Proper unique constraints

**Improvement Opportunities**:

- Query optimization for analytics workloads
- Missing composite indexes for complex filters
- Potential N+1 query issues in API endpoints

## Phase 1: Query Optimization (Immediate - Week 1)

### 1.1 Missing Composite Indexes

```sql
-- Analytics Performance (Heavy Usage)
CREATE INDEX idx_hypothesis_events_user_timestamp_hypothesis
ON hypothesis_validation_events(user_id, timestamp DESC, hypothesis);

CREATE INDEX idx_proposal_status_customer_created
ON proposals(status, customer_id, created_at DESC);

CREATE INDEX idx_content_search_optimization
ON content(type, is_active, category, created_at DESC);

-- Approval Workflow Performance
CREATE INDEX idx_approval_execution_status_workflow_started
ON approval_executions(status, workflow_id, started_at DESC);

-- Validation Performance
CREATE INDEX idx_validation_issues_entity_severity_status
ON validation_issues(entity_type, severity, status, detected_at DESC);
```

### 1.2 Query Pattern Analysis

**Problem Areas Identified**:

```typescript
// SLOW: Multiple separate queries (N+1 pattern)
const proposals = await prisma.proposal.findMany();
for (const proposal of proposals) {
  const customer = await prisma.customer.findUnique({
    where: { id: proposal.customerId },
  });
}

// FAST: Single query with includes
const proposals = await prisma.proposal.findMany({
  include: {
    customer: true,
    products: {
      include: {
        product: true,
      },
    },
    sections: true,
  },
});
```

## Phase 2: Connection Pooling & Caching (Week 2)

### 2.1 Prisma Connection Optimization

```typescript
// src/lib/db/prisma.ts enhancement
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Connection pool configuration
prisma.$connect();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 2.2 Query Result Caching

```typescript
// Implement Redis caching for frequently accessed data
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
});

export async function getCachedProposals(filters: ProposalFilters) {
  const cacheKey = `proposals:${JSON.stringify(filters)}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const proposals = await prisma.proposal.findMany({
    where: buildProposalWhereClause(filters),
    include: {
      customer: true,
      products: true,
    },
  });

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(proposals));
  return proposals;
}
```

## Phase 3: Analytics Query Optimization (Week 3)

### 3.1 Materialized Views for Analytics

```sql
-- Create view for proposal analytics
CREATE MATERIALIZED VIEW proposal_analytics_summary AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  status,
  COUNT(*) as count,
  AVG(value) as avg_value,
  SUM(value) as total_value,
  AVG(EXTRACT(EPOCH FROM (COALESCE(approved_at, NOW()) - created_at))/3600) as avg_processing_hours
FROM proposals
GROUP BY DATE_TRUNC('day', created_at), status;

-- Index for fast queries
CREATE INDEX idx_proposal_analytics_date_status
ON proposal_analytics_summary(date DESC, status);

-- Refresh schedule (daily)
-- Set up pg_cron job or application-level refresh
```

### 3.2 Hypothesis Validation Performance

```sql
-- Optimized index for hypothesis queries
CREATE INDEX idx_hypothesis_validation_compound
ON hypothesis_validation_events(
  hypothesis,
  user_id,
  timestamp DESC,
  target_value,
  actual_value
) WHERE actual_value IS NOT NULL;

-- Performance baseline queries
CREATE INDEX idx_performance_baseline_lookup
ON performance_baselines(hypothesis, metric_name, collection_date DESC);
```

## Phase 4: Database Schema Enhancements (Week 4)

### 4.1 Add Missing Constraints

```sql
-- Performance constraints
ALTER TABLE proposals
ADD CONSTRAINT check_value_positive
CHECK (value IS NULL OR value >= 0);

ALTER TABLE proposal_products
ADD CONSTRAINT check_quantity_positive
CHECK (quantity > 0);

-- Analytics constraints
ALTER TABLE hypothesis_validation_events
ADD CONSTRAINT check_improvement_range
CHECK (performance_improvement >= -100 AND performance_improvement <= 1000);
```

### 4.2 Partitioning for Large Tables

```sql
-- Partition audit_logs by date (if growing large)
CREATE TABLE audit_logs_partitioned (
  id TEXT,
  user_id TEXT,
  action TEXT,
  entity TEXT,
  entity_id TEXT,
  timestamp TIMESTAMPTZ,
  -- other columns
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Implementation Priority Matrix

### 🔴 Critical (Week 1):

1. Add missing composite indexes for analytics queries
2. Fix N+1 query patterns in API endpoints
3. Implement basic query result caching

### 🟡 High (Week 2):

1. Optimize Prisma connection pooling
2. Implement Redis caching layer
3. Add query performance monitoring

### 🟢 Medium (Week 3):

1. Create materialized views for analytics
2. Implement database query optimization
3. Add performance baseline tracking

### 🔵 Nice-to-Have (Week 4):

1. Database partitioning for audit logs
2. Advanced caching strategies
3. Query performance dashboard

## Performance Monitoring

### Key Metrics to Track:

```typescript
// Database performance monitoring
export interface DatabaseMetrics {
  averageQueryTime: number;
  slowQueryCount: number;
  connectionPoolUtilization: number;
  cacheHitRate: number;
  totalQueries: number;
  errorRate: number;
}

// Track in analytics
function trackDatabasePerformance(metrics: DatabaseMetrics) {
  analytics.track('database_performance', {
    ...metrics,
    timestamp: Date.now(),
  });
}
```

### Query Performance Targets:

- **API Response Time**: <200ms for 95% of requests
- **Database Query Time**: <50ms average
- **Cache Hit Rate**: >80% for frequently accessed data
- **Connection Pool**: <70% utilization peak

## Expected Performance Improvements:

- **20-40%** reduction in API response times
- **50-70%** improvement in analytics dashboard load times
- **60-80%** reduction in database load through caching
- **90%+** elimination of N+1 query patterns

This optimization plan will significantly improve application performance while
maintaining data integrity and reliability.
