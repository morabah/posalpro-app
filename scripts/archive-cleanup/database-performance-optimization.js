#!/usr/bin/env node

/**
 * PosalPro MVP2 - Database Performance Optimization Script
 * Fixes critical performance bottlenecks identified in server logs
 * Target: Reduce 18+ second response times to <200ms
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

class DatabasePerformanceOptimizer {
  constructor() {
    this.metrics = {
      indexesCreated: 0,
      queriesOptimized: 0,
      performanceTests: [],
      totalOptimizationTime: 0,
    };
  }

  async optimizeDatabase() {
    console.log('🚀 Starting Database Performance Optimization...\n');
    const startTime = Date.now();

    try {
      await this.step1_CreateCriticalIndexes();
      await this.step2_OptimizeProductStatsQueries();
      await this.step3_CreateMaterializedViews();
      await this.step4_RunPerformanceTests();
      await this.step5_GenerateOptimizationReport();

      this.metrics.totalOptimizationTime = Date.now() - startTime;
      console.log(
        `\n🎉 Database optimization completed in ${this.metrics.totalOptimizationTime}ms`
      );
    } catch (error) {
      console.error('❌ Database optimization failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async step1_CreateCriticalIndexes() {
    console.log('📍 Step 1: Creating Critical Performance Indexes...');

    const criticalIndexes = [
      // Product performance indexes (addresses 18s product stats queries)
      {
        name: 'product_active_category_price_idx',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "product_active_category_price_idx"
              ON "Product" ("isActive", category, price)
              WHERE "isActive" = true;`,
        description: 'Optimizes product filtering by active status, category, and price',
      },
      {
        name: 'product_created_active_idx',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "product_created_active_idx"
              ON "Product" ("createdAt", "isActive")
              WHERE "isActive" = true;`,
        description: 'Optimizes date-based product queries',
      },
      {
        name: 'product_category_gin_idx',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "product_category_gin_idx"
              ON "Product" USING GIN (category);`,
        description: 'Optimizes category array searches',
      },

      // ProposalProduct performance indexes (addresses slow aggregations)
      {
        name: 'proposal_product_groupby_idx',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "proposal_product_groupby_idx"
              ON "ProposalProduct" ("productId", total);`,
        description: 'Optimizes product usage statistics and revenue calculations',
      },
      {
        name: 'proposal_product_total_idx',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "proposal_product_total_idx"
              ON "ProposalProduct" (total)
              WHERE total IS NOT NULL;`,
        description: 'Optimizes revenue aggregation queries',
      },

      // Proposal performance indexes
      {
        name: 'proposal_status_created_idx',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "proposal_status_created_idx"
              ON "Proposal" (status, "createdAt");`,
        description: 'Optimizes proposal status and date filtering',
      },
      {
        name: 'proposal_customer_status_idx',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "proposal_customer_status_idx"
              ON "Proposal" ("customerId", status);`,
        description: 'Optimizes customer-specific proposal queries',
      },

      // ValidationIssue performance indexes
      {
        name: 'validation_issue_status_idx',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "validation_issue_status_idx"
              ON "ValidationIssue" (status, "proposalProductId");`,
        description: 'Optimizes validation issue counting',
      },

      // Analytics and hypothesis tracking indexes
      {
        name: 'hypothesis_validation_user_time_idx',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "hypothesis_validation_user_time_idx"
              ON "HypothesisValidationEvent" ("userId", hypothesis, timestamp);`,
        description: 'Optimizes analytics and hypothesis tracking queries',
      },

      // User and session indexes
      {
        name: 'user_email_status_idx',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "user_email_status_idx"
              ON "User" (email, status);`,
        description: 'Optimizes user authentication queries',
      },
    ];

    for (const index of criticalIndexes) {
      try {
        console.log(`   Creating ${index.name}...`);
        await prisma.$executeRawUnsafe(index.sql);
        console.log(`   ✅ ${index.name}: ${index.description}`);
        this.metrics.indexesCreated++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️ ${index.name}: Already exists`);
        } else {
          console.log(`   ❌ ${index.name}: Failed - ${error.message}`);
        }
      }
    }

    console.log(`✅ Created ${this.metrics.indexesCreated} new indexes\n`);
  }

  async step2_OptimizeProductStatsQueries() {
    console.log('📍 Step 2: Creating Optimized Product Stats Queries...');

    // Create optimized product stats function
    const optimizedStatsFunction = `
      CREATE OR REPLACE FUNCTION get_optimized_product_stats(
        date_from TIMESTAMP DEFAULT NULL,
        date_to TIMESTAMP DEFAULT NULL,
        categories TEXT[] DEFAULT NULL,
        is_active_filter BOOLEAN DEFAULT NULL
      )
      RETURNS JSON AS $$
      DECLARE
        result JSON;
        where_clause TEXT := 'WHERE 1=1';
      BEGIN
        -- Build dynamic WHERE clause
        IF date_from IS NOT NULL THEN
          where_clause := where_clause || ' AND "createdAt" >= ''' || date_from || '''';
        END IF;

        IF date_to IS NOT NULL THEN
          where_clause := where_clause || ' AND "createdAt" <= ''' || date_to || '''';
        END IF;

        IF categories IS NOT NULL AND array_length(categories, 1) > 0 THEN
          where_clause := where_clause || ' AND category && ARRAY[' ||
                         array_to_string(ARRAY(SELECT '''' || unnest(categories) || ''''), ',') || ']';
        END IF;

        IF is_active_filter IS NOT NULL THEN
          where_clause := where_clause || ' AND "isActive" = ' || is_active_filter;
        END IF;

        -- Execute optimized aggregation query
        EXECUTE '
          SELECT json_build_object(
            ''total'', COUNT(*),
            ''active'', COUNT(*) FILTER (WHERE "isActive" = true),
            ''inactive'', COUNT(*) FILTER (WHERE "isActive" = false),
            ''averagePrice'', AVG(price),
            ''categoryStats'', (
              SELECT json_object_agg(category_name, category_count)
              FROM (
                SELECT unnest(category) as category_name, COUNT(*) as category_count
                FROM "Product" ' || where_clause || '
                GROUP BY unnest(category)
              ) cat_stats
            )
          )
          FROM "Product" ' || where_clause
        INTO result;

        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await prisma.$executeRawUnsafe(optimizedStatsFunction);
      console.log('   ✅ Created optimized product stats function');
      this.metrics.queriesOptimized++;
    } catch (error) {
      console.log(`   ❌ Failed to create stats function: ${error.message}`);
    }

    // Create materialized view for product usage statistics
    const productUsageView = `
      CREATE MATERIALIZED VIEW IF NOT EXISTS product_usage_stats AS
      SELECT
        p.id,
        p.name,
        COUNT(pp."productId") as usage_count,
        COALESCE(SUM(pp.total), 0) as total_revenue,
        COALESCE(AVG(pp.quantity), 0) as avg_quantity
      FROM "Product" p
      LEFT JOIN "ProposalProduct" pp ON p.id = pp."productId"
      GROUP BY p.id, p.name
      ORDER BY usage_count DESC;

      CREATE UNIQUE INDEX IF NOT EXISTS product_usage_stats_id_idx
      ON product_usage_stats (id);
    `;

    try {
      await prisma.$executeRawUnsafe(productUsageView);
      console.log('   ✅ Created product usage statistics materialized view');
      this.metrics.queriesOptimized++;
    } catch (error) {
      console.log(`   ❌ Failed to create usage view: ${error.message}`);
    }

    console.log(`✅ Optimized ${this.metrics.queriesOptimized} query patterns\n`);
  }

  async step3_CreateMaterializedViews() {
    console.log('📍 Step 3: Creating Materialized Views for Fast Aggregations...');

    const views = [
      {
        name: 'proposal_summary_stats',
        sql: `
          CREATE MATERIALIZED VIEW IF NOT EXISTS proposal_summary_stats AS
          SELECT
            status,
            priority,
            COUNT(*) as count,
            AVG(value) as avg_value,
            SUM(value) as total_value,
            DATE_TRUNC('month', "createdAt") as month
          FROM "Proposal"
          GROUP BY status, priority, DATE_TRUNC('month', "createdAt");

          CREATE INDEX IF NOT EXISTS proposal_summary_stats_status_idx
          ON proposal_summary_stats (status, priority);
        `,
        description: 'Fast proposal statistics by status and priority',
      },
      {
        name: 'customer_activity_summary',
        sql: `
          CREATE MATERIALIZED VIEW IF NOT EXISTS customer_activity_summary AS
          SELECT
            c.id,
            c.name,
            c.tier,
            c.status,
            COUNT(p.id) as proposal_count,
            COALESCE(SUM(p.value), 0) as total_value,
            MAX(p."createdAt") as last_proposal_date
          FROM "Customer" c
          LEFT JOIN "Proposal" p ON c.id = p."customerId"
          GROUP BY c.id, c.name, c.tier, c.status;

          CREATE UNIQUE INDEX IF NOT EXISTS customer_activity_summary_id_idx
          ON customer_activity_summary (id);
        `,
        description: 'Fast customer activity and value statistics',
      },
    ];

    for (const view of views) {
      try {
        await prisma.$executeRawUnsafe(view.sql);
        console.log(`   ✅ ${view.name}: ${view.description}`);
      } catch (error) {
        console.log(`   ❌ ${view.name}: Failed - ${error.message}`);
      }
    }

    console.log('✅ Created materialized views for fast aggregations\n');
  }

  async step4_RunPerformanceTests() {
    console.log('📍 Step 4: Running Performance Tests...');

    const tests = [
      {
        name: 'Product Stats Query (Original Problem)',
        test: async () => {
          const start = Date.now();
          const result = await prisma.$queryRaw`
            SELECT get_optimized_product_stats(NULL, NULL, NULL, true);
          `;
          return Date.now() - start;
        },
        target: 200, // Target: <200ms
      },
      {
        name: 'Product Search with Filters',
        test: async () => {
          const start = Date.now();
          await prisma.product.findMany({
            where: {
              isActive: true,
              category: { hasSome: ['software'] },
              price: { gte: 100, lte: 1000 },
            },
            take: 20,
            orderBy: { createdAt: 'desc' },
          });
          return Date.now() - start;
        },
        target: 100, // Target: <100ms
      },
      {
        name: 'Proposal with Relations',
        test: async () => {
          const start = Date.now();
          await prisma.proposal.findMany({
            include: {
              customer: { select: { id: true, name: true, tier: true } },
              products: {
                include: {
                  product: { select: { id: true, name: true, price: true } },
                },
              },
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
          });
          return Date.now() - start;
        },
        target: 150, // Target: <150ms
      },
      {
        name: 'Product Usage Statistics',
        test: async () => {
          const start = Date.now();
          await prisma.$queryRaw`
            SELECT * FROM product_usage_stats
            ORDER BY usage_count DESC
            LIMIT 10;
          `;
          return Date.now() - start;
        },
        target: 50, // Target: <50ms
      },
    ];

    for (const test of tests) {
      try {
        const duration = await test.test();
        const status =
          duration <= test.target
            ? '🚀 Excellent'
            : duration <= test.target * 2
              ? '✅ Good'
              : duration <= test.target * 5
                ? '⚠️ Acceptable'
                : '❌ Poor';

        console.log(`   ${test.name}: ${duration}ms ${status} (Target: ${test.target}ms)`);

        this.metrics.performanceTests.push({
          name: test.name,
          duration,
          target: test.target,
          status: status.split(' ')[1],
          improvement: duration <= test.target,
        });
      } catch (error) {
        console.log(`   ${test.name}: ❌ Failed - ${error.message}`);
        this.metrics.performanceTests.push({
          name: test.name,
          duration: null,
          target: test.target,
          status: 'Failed',
          improvement: false,
          error: error.message,
        });
      }
    }

    console.log('✅ Performance tests completed\n');
  }

  async step5_GenerateOptimizationReport() {
    console.log('📍 Step 5: Generating Optimization Report...');

    const successfulTests = this.metrics.performanceTests.filter(t => t.improvement).length;
    const totalTests = this.metrics.performanceTests.length;
    const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

    const report = {
      timestamp: new Date().toISOString(),
      optimizationSummary: {
        indexesCreated: this.metrics.indexesCreated,
        queriesOptimized: this.metrics.queriesOptimized,
        totalOptimizationTime: this.metrics.totalOptimizationTime,
        successRate: `${successRate.toFixed(1)}%`,
      },
      performanceTests: this.metrics.performanceTests,
      recommendations: this.generateRecommendations(),
    };

    // Save report to file
    const reportPath = path.join(__dirname, '../docs/DATABASE_PERFORMANCE_OPTIMIZATION_REPORT.md');
    const reportContent = this.formatReportAsMarkdown(report);

    fs.writeFileSync(reportPath, reportContent);
    console.log(`✅ Optimization report saved to: ${reportPath}\n`);

    // Display summary
    console.log('📊 OPTIMIZATION SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`🔧 Indexes Created:       ${report.optimizationSummary.indexesCreated}`);
    console.log(`⚡ Queries Optimized:     ${report.optimizationSummary.queriesOptimized}`);
    console.log(`📈 Success Rate:          ${report.optimizationSummary.successRate}`);
    console.log(`⏱️  Total Time:           ${report.optimizationSummary.totalOptimizationTime}ms`);
    console.log('═══════════════════════════════════════');
  }

  generateRecommendations() {
    const recommendations = [
      '🔄 Refresh materialized views daily with a cron job',
      '📊 Monitor query performance with pg_stat_statements',
      '🗄️ Consider partitioning large tables by date',
      '💾 Implement Redis caching for frequently accessed data',
      '🔍 Use EXPLAIN ANALYZE to monitor query execution plans',
      '📈 Set up automated performance alerts for slow queries',
      '🧹 Regular VACUUM and ANALYZE operations for optimal performance',
    ];

    return recommendations;
  }

  formatReportAsMarkdown(report) {
    return `# Database Performance Optimization Report

**Generated:** ${report.timestamp}

## Optimization Summary

- **Indexes Created:** ${report.optimizationSummary.indexesCreated}
- **Queries Optimized:** ${report.optimizationSummary.queriesOptimized}
- **Success Rate:** ${report.optimizationSummary.successRate}
- **Total Optimization Time:** ${report.optimizationSummary.totalOptimizationTime}ms

## Performance Test Results

| Test Name | Duration (ms) | Target (ms) | Status | Improvement |
|-----------|---------------|-------------|---------|-------------|
${report.performanceTests
  .map(
    test =>
      `| ${test.name} | ${test.duration || 'Failed'} | ${test.target} | ${test.status} | ${test.improvement ? '✅' : '❌'} |`
  )
  .join('\n')}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

1. Monitor query performance in production
2. Set up automated materialized view refresh
3. Implement Redis caching layer
4. Continue monitoring and optimization

---

*Generated by PosalPro MVP2 Database Performance Optimizer*
`;
  }
}

// Create and run the optimizer
async function main() {
  const optimizer = new DatabasePerformanceOptimizer();
  await optimizer.optimizeDatabase();
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DatabasePerformanceOptimizer };
