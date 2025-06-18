/**
 * PosalPro MVP2 - Contact Support Page
 * Provides contact information for user support
 */

import { Mail, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Contact Support</h1>
          <p className="mt-4 text-lg text-gray-600">
            Need help with PosalPro? We're here to assist you.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Email Support */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Email Support</h3>
                  <p className="text-sm text-gray-500">General inquiries and support</p>
                </div>
              </div>
              <div className="mt-4">
                <a
                  href="mailto:support@posalpro.com"
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  support@posalpro.com
                </a>
                <p className="text-sm text-gray-500 mt-1">Response time: 24-48 hours</p>
              </div>
            </div>
          </div>

          {/* Chat Support */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Live Chat</h3>
                  <p className="text-sm text-gray-500">Real-time assistance</p>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 font-medium">Start Chat (Coming Soon)</span>
                <p className="text-sm text-gray-500 mt-1">Available Mon-Fri 9AM-5PM PST</p>
              </div>
            </div>
          </div>

          {/* Phone Support */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Phone className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Phone Support</h3>
                  <p className="text-sm text-gray-500">For urgent issues</p>
                </div>
              </div>
              <div className="mt-4">
                <a
                  href="tel:+1-555-POSAL-PRO"
                  className="text-purple-600 hover:text-purple-500 font-medium"
                >
                  +1 (555) POSAL-PRO
                </a>
                <p className="text-sm text-gray-500 mt-1">Available Mon-Fri 9AM-5PM PST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="mt-12 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Common Issues</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Authentication Problems</h3>
                <p className="text-sm text-gray-600">
                  If you're having trouble signing in, try resetting your password or contact your
                  administrator.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Permission Errors</h3>
                <p className="text-sm text-gray-600">
                  Access denied messages usually indicate insufficient permissions. Contact your
                  admin to review your role.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">System Issues</h3>
                <p className="text-sm text-gray-600">
                  For technical problems or system outages, check our status page or contact
                  support.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to App */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to PosalPro
          </Link>
        </div>
      </div>
    </div>
  );
}
