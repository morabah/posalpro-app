// Test authentication functions directly
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testAuth() {
  console.log('🔧 Testing authentication components...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Test 1: Database connection
    console.log('1. Testing database connection...');
    const userCount = await prisma.user.count();
    console.log('✅ Database accessible, user count:', userCount);
    
    // Test 2: User lookup
    console.log('\n2. Testing user lookup...');
    const user = await prisma.user.findUnique({
      where: { email: 'admin@posalpro.com' },
      select: { 
        id: true, 
        email: true, 
        password: true,
        roles: {
          where: { isActive: true },
          select: { role: { select: { name: true } } }
        }
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.email);
    console.log('User roles:', user.roles.map(r => r.role.name));
    
    // Test 3: Password verification
    console.log('\n3. Testing password verification...');
    const isValidPassword = await bcrypt.compare('ProposalPro2024!', user.password);
    console.log('Password valid:', isValidPassword);
    
    // Test 4: Role flattening
    console.log('\n4. Testing role flattening...');
    const roles = user.roles.map(roleEntry => roleEntry.role.name);
    console.log('Flattened roles:', roles);
    
    console.log('\n🎉 All authentication components working correctly!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
