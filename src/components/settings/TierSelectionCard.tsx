'use client';

import { useState } from 'react';

export function TierSelectionCard() {
  const [currentTier, setCurrentTier] = useState<'basic' | 'advanced' | 'enterprise'>('basic');

  const handleTierSelect = (tier: 'basic' | 'advanced' | 'enterprise') => {
    setCurrentTier(tier);
  };

  const tiers = [
    {
      id: 'basic' as const,
      name: 'Basic Tier',
      description: 'Essential features for proposal management',
      features: ['Dashboard', 'Proposals', 'Products', 'Customers'],
    },
    {
      id: 'advanced' as const,
      name: 'Advanced Tier',
      description: 'Enhanced features with validation tools',
      features: ['Dashboard', 'Proposals', 'Products', 'Customers', 'Coordination', 'Validation'],
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise Tier',
      description: 'Complete feature set with all capabilities',
      features: ['All Features Available'],
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Application Tier Selection</h2>
      <p className="text-sm text-gray-600 mb-6">
        Choose your application tier to customize the sidebar navigation and available features
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map(tier => {
          const isSelected = tier.id === currentTier;

          return (
            <div
              key={tier.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTierSelect(tier.id)}
            >
              <h3
                className={`font-medium capitalize ${
                  isSelected ? 'text-blue-600' : 'text-gray-900'
                }`}
              >
                {tier.name}
              </h3>
              <p className="text-sm text-gray-600 mt-2">{tier.description}</p>

              <div className="mt-3">
                <ul className="text-xs text-gray-500 space-y-1">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg
                        className="w-3 h-3 mr-1 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`w-full mt-4 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white cursor-default'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSelected ? 'Selected' : 'Select'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Current Tier: <span className="capitalize text-blue-600">{currentTier}</span>
        </h4>
        <p className="text-xs text-gray-600">
          This tier controls which sidebar sections are visible in your navigation. Changes take
          effect immediately.
        </p>
      </div>
    </div>
  );
}
