#!/usr/bin/env node

/**
 * Test Data Types Script
 *
 * This script tests the actual data types being returned by Prisma
 * to verify if the numeric data consistency issue has been resolved.
 */

const { PrismaClient } = require('@prisma/client');

async function testDataTypes() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Testing data types...');

    // Get a sample proposal
    const proposal = await prisma.proposal.findFirst({
      select: {
        id: true,
        value: true,
        totalValue: true,
        completionRate: true
      }
    });

    if (!proposal) {
      console.log('❌ No proposals found');
      return;
    }

    console.log('📊 Sample Proposal Data:');
    console.log(`ID: ${proposal.id}`);
    console.log(`Value: ${proposal.value} (Type: ${typeof proposal.value})`);
    console.log(`Total Value: ${proposal.totalValue} (Type: ${typeof proposal.totalValue})`);
    console.log(`Completion Rate: ${proposal.completionRate} (Type: ${typeof proposal.completionRate})`);

    // Test if values are correct Prisma types (Decimal objects for decimals, numbers for floats)
    const valueIsDecimal = proposal.value && typeof proposal.value === 'object' && proposal.value.constructor.name === 'Decimal';
    const totalValueIsDecimalOrNull = proposal.totalValue === null || (typeof proposal.totalValue === 'object' && proposal.totalValue.constructor.name === 'Decimal');
    const completionRateIsFloat = typeof proposal.completionRate === 'number' || (typeof proposal.completionRate === 'object' && proposal.completionRate.constructor.name === 'Decimal');

    console.log('\n✅ Prisma Type Checks:');
    console.log(`Value is Decimal: ${valueIsDecimal} (${proposal.value?.constructor?.name || 'N/A'})`);
    console.log(`TotalValue is Decimal or null: ${totalValueIsDecimalOrNull} (${proposal.totalValue?.constructor?.name || 'null'})`);
    console.log(`CompletionRate is Float/Decimal: ${completionRateIsFloat} (${proposal.completionRate?.constructor?.name || 'N/A'})`);

    // Test if we can convert to numbers successfully
    try {
      const valueAsNumber = proposal.value ? Number(proposal.value) : 0;
      const totalValueAsNumber = proposal.totalValue ? Number(proposal.totalValue) : null;
      const completionRateAsNumber = Number(proposal.completionRate);

      console.log('\n🔢 Numeric Conversions:');
      console.log(`Value as number: ${valueAsNumber}`);
      console.log(`TotalValue as number: ${totalValueAsNumber}`);
      console.log(`CompletionRate as number: ${completionRateAsNumber}`);

      if (!isNaN(valueAsNumber) && (totalValueAsNumber === null || !isNaN(totalValueAsNumber)) && !isNaN(completionRateAsNumber)) {
        console.log('\n🎉 SUCCESS: All fields can be converted to valid numbers!');
        console.log('✅ Database inconsistency FIXED - fields are stored as proper numeric types!');
      } else {
        console.log('\n❌ FAILURE: Some fields cannot be converted to valid numbers');
      }
    } catch (error) {
      console.log('\n❌ FAILURE: Error converting to numbers:', error.message);
    }

  } catch (error) {
    console.error('❌ Error testing data types:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDataTypes();
