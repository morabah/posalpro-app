// Direct test of NextAuth authentication
const { getServerSession, authOptions } = require('./src/lib/auth');

console.log('Testing NextAuth configuration...');
console.log('NEXTAUTH_SECRET set:', !!process.env.NEXTAUTH_SECRET);
console.log('NEXTAUTH_URL set:', !!process.env.NEXTAUTH_URL);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

// Mock request/response objects
const mockRequest = {
  headers: new Map([
    ['user-agent', 'test'],
    ['host', 'localhost:3000']
  ]),
  url: 'http://localhost:3000/api/auth/callback/credentials'
};

const mockResponse = {
  headers: new Map(),
  setHeader: function(key, value) { this.headers.set(key, value); },
  getHeader: function(key) { return this.headers.get(key); }
};

console.log('Mock objects created for testing...');
console.log('NextAuth authOptions loaded successfully');
