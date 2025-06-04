-- CreateEnum
CREATE TYPE "ValidationStatusType" AS ENUM ('PENDING', 'VALID', 'INVALID', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "TestStatusType" AS ENUM ('DRAFT', 'ACTIVE', 'EXECUTED', 'PASSED', 'FAILED', 'DEPRECATED');

-- CreateTable
CREATE TABLE "user_story_metrics" (
    "id" TEXT NOT NULL,
    "userStoryId" TEXT NOT NULL,
    "hypothesis" TEXT[],
    "acceptanceCriteria" TEXT[],
    "performanceTargets" JSONB NOT NULL,
    "actualPerformance" JSONB NOT NULL,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passedCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failedCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "baselineMetrics" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_story_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_baselines" (
    "id" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "baselineValue" DOUBLE PRECISION NOT NULL,
    "targetImprovement" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION,
    "improvementPercentage" DOUBLE PRECISION,
    "measurementUnit" TEXT NOT NULL,
    "collectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "sampleSize" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'development',
    "methodology" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_traceability" (
    "id" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "userStories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "acceptanceCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "methods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hypotheses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "testCases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "analyticsHooks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastValidated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validationStatus" "ValidationStatusType" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_traceability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "userStory" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "preconditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "testSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "acceptanceCriteria" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "measurementPoints" JSONB NOT NULL,
    "successThresholds" JSONB NOT NULL,
    "instrumentationRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "TestStatusType" NOT NULL DEFAULT 'DRAFT',
    "lastExecuted" TIMESTAMP(3),
    "passRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "componentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_execution_results" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "userStoryId" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "passed" BOOLEAN,
    "executionTime" INTEGER NOT NULL,
    "metrics" JSONB,
    "errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "environment" TEXT NOT NULL DEFAULT 'development',
    "executedBy" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_execution_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baseline_metrics" (
    "id" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "sampleSize" INTEGER NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'development',
    "methodology" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baseline_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_story_metrics_userStoryId_key" ON "user_story_metrics"("userStoryId");

-- CreateIndex
CREATE INDEX "user_story_metrics_userStoryId_idx" ON "user_story_metrics"("userStoryId");

-- CreateIndex
CREATE INDEX "user_story_metrics_completionRate_idx" ON "user_story_metrics"("completionRate");

-- CreateIndex
CREATE INDEX "performance_baselines_hypothesis_metricName_idx" ON "performance_baselines"("hypothesis", "metricName");

-- CreateIndex
CREATE INDEX "performance_baselines_collectionDate_idx" ON "performance_baselines"("collectionDate");

-- CreateIndex
CREATE UNIQUE INDEX "performance_baselines_hypothesis_metricName_collectionDate_key" ON "performance_baselines"("hypothesis", "metricName", "collectionDate");

-- CreateIndex
CREATE UNIQUE INDEX "component_traceability_componentName_key" ON "component_traceability"("componentName");

-- CreateIndex
CREATE INDEX "component_traceability_componentName_idx" ON "component_traceability"("componentName");

-- CreateIndex
CREATE INDEX "component_traceability_validationStatus_idx" ON "component_traceability"("validationStatus");

-- CreateIndex
CREATE INDEX "component_traceability_userStories_idx" ON "component_traceability"("userStories");

-- CreateIndex
CREATE INDEX "test_cases_userStory_idx" ON "test_cases"("userStory");

-- CreateIndex
CREATE INDEX "test_cases_hypothesis_idx" ON "test_cases"("hypothesis");

-- CreateIndex
CREATE INDEX "test_cases_status_idx" ON "test_cases"("status");

-- CreateIndex
CREATE INDEX "test_execution_results_testCaseId_idx" ON "test_execution_results"("testCaseId");

-- CreateIndex
CREATE INDEX "test_execution_results_userStoryId_idx" ON "test_execution_results"("userStoryId");

-- CreateIndex
CREATE INDEX "test_execution_results_hypothesis_timestamp_idx" ON "test_execution_results"("hypothesis", "timestamp");

-- CreateIndex
CREATE INDEX "test_execution_results_passed_timestamp_idx" ON "test_execution_results"("passed", "timestamp");

-- CreateIndex
CREATE INDEX "baseline_metrics_hypothesis_metric_idx" ON "baseline_metrics"("hypothesis", "metric");

-- CreateIndex
CREATE INDEX "baseline_metrics_collectedAt_idx" ON "baseline_metrics"("collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "baseline_metrics_hypothesis_metric_collectedAt_key" ON "baseline_metrics"("hypothesis", "metric", "collectedAt");

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "component_traceability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_execution_results" ADD CONSTRAINT "test_execution_results_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_execution_results" ADD CONSTRAINT "test_execution_results_userStoryId_fkey" FOREIGN KEY ("userStoryId") REFERENCES "user_story_metrics"("userStoryId") ON DELETE CASCADE ON UPDATE CASCADE;
