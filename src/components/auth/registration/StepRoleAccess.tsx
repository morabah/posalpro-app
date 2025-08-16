'use client';

interface StepRoleAccessProps {
  register: any;
  errors: any;
  setValue: any;
  watch: any;
}

const AVAILABLE_TEAMS = [
  'Healthcare Solutions Team',
  'Enterprise Proposals Team',
  'Government Contracts Team',
  'Financial Services Team',
];

export default function StepRoleAccess({ register, errors, setValue }: StepRoleAccessProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900">Role & Access</h3>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Primary Role *</label>
        <input
          {...register('primaryRole')}
          type="text"
          className={`w-full h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.primaryRole ? 'border-red-300' : 'border-neutral-300'
          }`}
        />
        {errors.primaryRole && (
          <p className="mt-1 text-sm text-red-600">{errors.primaryRole.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-4">Team Assignments:</label>
        <div className="space-y-3">
          {AVAILABLE_TEAMS.map(team => (
            <label key={team} className="flex items-center">
              <input
                type="checkbox"
                onChange={e => {
                  setValue('teamAssignments', (prev: string[] = []) =>
                    e.currentTarget.checked
                      ? [...prev, team]
                      : prev.filter(t => t !== team)
                  );
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
              />
              <span className="ml-3 text-sm text-neutral-700">{team}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-4">System Access Level:</label>
        <div className="space-y-3">
          {['standard', 'power', 'admin'].map(level => (
            <label key={level} className="flex items-center">
              <input
                {...register('accessLevel')}
                type="radio"
                value={level}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-neutral-700">{level}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
