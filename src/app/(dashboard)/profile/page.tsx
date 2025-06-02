/**
 * PosalPro MVP2 - User Profile Page
 * User profile management with navigation integration
 * Based on wireframe specifications
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Label } from '@/components/ui/Label';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: 'Mohamed Rahman',
    email: 'mohamed@example.com',
    role: 'manager',
    department: 'Business Development',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs className="mb-6" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <UserCircleIcon className="w-16 h-16 text-gray-400" />
            <div>
              <h2 className="text-xl font-medium text-gray-900">{user.name}</h2>
              <p className="text-gray-600">
                {user.role} • {user.department}
              </p>
            </div>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={user.name}
                  onChange={e => setUser({ ...user, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  onChange={e => setUser({ ...user, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={user.role} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={user.department}
                  onChange={e => setUser({ ...user, department: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="secondary">Cancel</Button>
              <Button variant="primary">Save Changes</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
