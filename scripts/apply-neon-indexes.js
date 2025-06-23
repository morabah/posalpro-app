#!/usr/bin/env node

const { Client } = require('pg');

const NEON_DATABASE_URL =
  'postgresql://neondb_owner:npg_XufaK0v9TOgn@ep-ancient-sun-a9gve4ul-pooler.gwc.azure.neon.tech/neondb?sslmode=require';

console.log('🚀 Applying Performance Indexes to Neon Database');
console.log('================================================\n');

async function applyIndexesToNeon() {
  const client = new Client({
    connectionString: NEON_DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database');

    // Check existing tables
    console.log('\n📋 Checking existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('Tables found:', tablesResult.rows.map(r => r.table_name).join(', '));

    // Performance indexes to apply
    const indexes = [
      // Content optimization
      {
        name: 'content_title_type_active_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS content_title_type_active_performance_idx ON content (title, type, "isActive");',
        table: 'content',
      },
      {
        name: 'content_keywords_gin_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS content_keywords_gin_performance_idx ON content USING GIN (keywords);',
        table: 'content',
      },
      {
        name: 'content_tags_gin_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS content_tags_gin_performance_idx ON content USING GIN (tags);',
        table: 'content',
      },

      // Proposal optimization
      {
        name: 'proposal_status_priority_created_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS proposal_status_priority_created_performance_idx ON proposals (status, priority, "createdBy", "createdAt");',
        table: 'proposals',
      },
      {
        name: 'proposal_title_status_due_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS proposal_title_status_due_performance_idx ON proposals (title, status, "dueDate");',
        table: 'proposals',
      },

      // Product optimization
      {
        name: 'product_active_price_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS product_active_price_performance_idx ON products ("isActive", price);',
        table: 'products',
      },
      {
        name: 'product_name_active_created_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS product_name_active_created_performance_idx ON products (name, "isActive", "createdAt");',
        table: 'products',
      },
      {
        name: 'product_tags_gin_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS product_tags_gin_performance_idx ON products USING GIN (tags);',
        table: 'products',
      },
      {
        name: 'product_category_gin_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS product_category_gin_performance_idx ON products USING GIN (category);',
        table: 'products',
      },

      // Customer optimization
      {
        name: 'customer_status_industry_created_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS customer_status_industry_created_performance_idx ON customers (status, industry, "createdAt");',
        table: 'customers',
      },
      {
        name: 'customer_name_email_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS customer_name_email_performance_idx ON customers (name, email);',
        table: 'customers',
      },

      // Analytics optimization
      {
        name: 'hypothesis_validation_hypothesis_user_time_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS hypothesis_validation_hypothesis_user_time_performance_idx ON hypothesis_validation_events (hypothesis, "userId", timestamp);',
        table: 'hypothesis_validation_events',
      },
      {
        name: 'user_story_metrics_story_completion_updated_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS user_story_metrics_story_completion_updated_performance_idx ON user_story_metrics ("userStoryId", "completionRate", "lastUpdated");',
        table: 'user_story_metrics',
      },
      {
        name: 'performance_baselines_hypothesis_metric_date_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS performance_baselines_hypothesis_metric_date_performance_idx ON performance_baselines (hypothesis, "metricName", "collectionDate");',
        table: 'performance_baselines',
      },

      // RBAC optimization
      {
        name: 'user_roles_user_role_active_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS user_roles_user_role_active_performance_idx ON user_roles ("userId", "roleId", "isActive");',
        table: 'user_roles',
      },
      {
        name: 'user_sessions_token_active_expires_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS user_sessions_token_active_expires_performance_idx ON user_sessions ("sessionToken", "isActive", "expiresAt");',
        table: 'user_sessions',
      },
      {
        name: 'audit_logs_user_timestamp_action_performance_idx',
        sql: 'CREATE INDEX IF NOT EXISTS audit_logs_user_timestamp_action_performance_idx ON audit_logs ("userId", timestamp, action);',
        table: 'audit_logs',
      },
    ];

    const existingTables = new Set(tablesResult.rows.map(r => r.table_name));
    let appliedCount = 0;
    let skippedCount = 0;

    console.log('\n🔧 Applying performance indexes...');

    for (const index of indexes) {
      if (existingTables.has(index.table)) {
        try {
          await client.query(index.sql);
          console.log(`  ✅ Applied: ${index.name}`);
          appliedCount++;
        } catch (error) {
          console.log(`  ⚠️  Skipped: ${index.name} (${error.message})`);
          skippedCount++;
        }
      } else {
        console.log(`  ⏭️  Skipped: ${index.name} (table ${index.table} not found)`);
        skippedCount++;
      }
    }

    // Verify indexes
    console.log('\n📊 Verifying applied indexes...');
    const indexResult = await client.query(`
      SELECT
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE indexname LIKE '%_performance_%'
      ORDER BY tablename, indexname;
    `);

    console.log(`Found ${indexResult.rows.length} performance indexes:`);
    indexResult.rows.forEach(row => {
      console.log(`  📍 ${row.tablename}.${row.indexname}`);
    });

    console.log('\n🎉 Performance Index Application Summary:');
    console.log(`  ✅ Applied: ${appliedCount}`);
    console.log(`  ⏭️  Skipped: ${skippedCount}`);
    console.log(`  📊 Total Performance Indexes: ${indexResult.rows.length}`);
  } catch (error) {
    console.error('❌ Error applying indexes:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Disconnected from Neon database');
  }
}

// Run the script
applyIndexesToNeon()
  .then(() => {
    console.log('\n🎯 Neon database optimization completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Failed to apply indexes to Neon:', error);
    process.exit(1);
  });
