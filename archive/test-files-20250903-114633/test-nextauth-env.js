// Test what environment variables NextAuth sees
console.log('Environment variables for NextAuth:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

// Test database connection with the same env as NextAuth would see
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findFirst({
  where: { email: 'admin@posalpro.com' },
  select: { id: true, email: true }
}).then(user => {
  console.log('Database test result:', user ? 'SUCCESS' : 'FAILED');
  return prisma.$disconnect();
}).catch(err => {
  console.log('Database error:', err.message);
  return prisma.$disconnect();
});
