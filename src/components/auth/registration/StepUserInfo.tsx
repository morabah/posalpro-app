'use client';

import { FieldErrors, UseFormRegister } from 'react-hook-form';

interface UserInfoFormData {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department: string;
  office: string;
  phone: string;
  passwordSetting: 'system' | 'first_login' | 'admin_set';
}

interface StepUserInfoProps {
  register: UseFormRegister<UserInfoFormData>;
  errors: FieldErrors<UserInfoFormData>;
  aiSuggestions: Record<string, string>;
}

export default function StepUserInfo({ register, errors, aiSuggestions }: StepUserInfoProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900">User Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">First Name *</label>
          <input
            {...register('firstName')}
            type="text"
            className={`w-full h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-300' : 'border-neutral-300'
            }`}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Last Name *</label>
          <input
            {...register('lastName')}
            type="text"
            className={`w-full h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-300' : 'border-neutral-300'
            }`}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Email *</label>
          <input
            {...register('email')}
            type="email"
            className={`w-full h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-300' : 'border-neutral-300'
            }`}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Title</label>
          <input
            {...register('title')}
            type="text"
            className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Department *</label>
          <input
            {...register('department')}
            type="text"
            className={`w-full h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.department ? 'border-red-300' : 'border-neutral-300'
            }`}
          />
          {errors.department && (
            <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
          )}
          {aiSuggestions.department && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start space-x-2">
                <span className="w-4 h-4 text-blue-500 mt-0.5" aria-hidden>
                  💡
                </span>
                <p className="text-sm text-blue-700">{aiSuggestions.department}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Office</label>
          <input
            {...register('office')}
            type="text"
            className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {aiSuggestions.office && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start space-x-2">
                <span className="w-4 h-4 text-blue-500 mt-0.5" aria-hidden>
                  💡
                </span>
                <p className="text-sm text-blue-700">{aiSuggestions.office}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full h-10 px-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-8">
        <label className="block text-sm font-medium text-neutral-700 mb-4">
          Initial Password Setting:
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              {...register('passwordSetting')}
              type="radio"
              value="system"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-neutral-700">System Generated (Email)</span>
          </label>
          <label className="flex items-center">
            <input
              {...register('passwordSetting')}
              type="radio"
              value="first_login"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-neutral-700">User Sets at First Login</span>
          </label>
          <label className="flex items-center">
            <input
              {...register('passwordSetting')}
              type="radio"
              value="admin_set"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-neutral-700">Admin Sets Password</span>
          </label>
        </div>
      </div>
    </div>
  );
}
