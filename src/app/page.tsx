import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to PosalPro MVP2
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Streamline your proposal management with our advanced platform
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link 
              href="/auth/register"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">Fast Performance</h3>
            <p className="text-gray-600">Optimized for speed with sub-second response times</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">Secure</h3>
            <p className="text-gray-600">Enterprise-grade security and authentication</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">Scalable</h3>
            <p className="text-gray-600">Built to handle growing business needs</p>
          </div>
        </div>
      </div>
    </div>
  );
}