/**
 * PosalPro MVP2 - Modern Landing Page
 * Enterprise-grade design with gradient elements and call-to-action
 */

import { Button } from '@/components/ui/forms/Button';
import { ArrowRightIcon, CheckCircleIcon, ShieldIcon, ZapIcon } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                PosalPro
              </h1>
              <span className="text-sm text-neutral-500 px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                MVP2 Ready
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-16 pb-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-neutral-900 mb-6 leading-tight">
              AI-Powered Proposal Management
              <span className="block text-4xl bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent mt-2">
                For Enterprise Success
              </span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              Streamline your proposal process with intelligent automation, role-based
              collaboration, and enterprise-grade security. Transform how your team creates winning
              proposals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/auth/register">
                <Button variant="primary" size="lg" className="shadow-lg hover:shadow-xl">
                  Start Free Trial
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="shadow-sm hover:shadow-md">
                  View Demo Dashboard
                </Button>
              </Link>
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center space-x-2 bg-white rounded-full px-6 py-3 shadow-lg border border-green-200">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-semibold">Phase 2.1.1 Complete</span>
              <span className="text-neutral-600">- Authentication System Ready!</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="pb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              Enterprise Features Built for Scale
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Everything you need to manage complex proposals with confidence and efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-6">
                <ZapIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">AI-Powered Automation</h3>
              <p className="text-neutral-600 leading-relaxed">
                Intelligent proposal generation, content suggestions, and automated workflows that
                save hours of manual work.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-6">
                <ShieldIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Enterprise Security</h3>
              <p className="text-neutral-600 leading-relaxed">
                Role-based access control, audit logging, and enterprise-grade security features for
                complete peace of mind.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-neutral-200 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 w-12 h-12 flex items-center justify-center mb-6">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">
                Streamlined Collaboration
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                Real-time collaboration tools, approval workflows, and team coordination features
                for seamless teamwork.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="pb-20">
          <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Proposals?</h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join leading enterprises who trust PosalPro for their mission-critical proposal
              processes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-primary-600 hover:bg-neutral-50 shadow-lg"
                >
                  Start Your Free Trial
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10"
                >
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-blue-400 bg-clip-text text-transparent">
              PosalPro
            </h3>
            <span className="text-neutral-400">Enterprise Proposal Management</span>
          </div>
          <p className="text-neutral-400 text-sm">
            © 2025 PosalPro. Built with modern web technologies for enterprise success.
          </p>
        </div>
      </footer>
    </div>
  );
}
