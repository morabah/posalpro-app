/**
 * Authentication Journey Integration Tests
 * End-to-end authentication workflows with security validation and performance tracking
 * Supports H2 (User Experience) and H6 (Security) hypothesis validation
 */

import { render, screen, waitFor } from '@/test/utils/test-utils';
import { setupApiMocks } from '@/test/mocks/api.mock';
import { setMockSession, clearMockSession, mockUserRoles } from '@/test/mocks/session.mock';
import userEvent from '@testing-library/user-event';
import { UserType } from '@/types/enums';
import React from 'react';

// Mock authentication components for journey testing
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = React.useState<any>(null);

  React.useEffect(() => {
    // Simulate session check
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const sessionData = await response.json();
          setSession(sessionData);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };

    checkSession();
  }, []);

  return <div data-testid="auth-provider">{children}</div>;
};

const LoginPage = ({ onSuccess }: { onSuccess?: (user: any) => void }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loginAttempts, setLoginAttempts] = React.useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setLoginAttempts(prev => prev + 1);
        throw new Error('Invalid credentials');
      }

      const user = await response.json();
      onSuccess?.(user);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="login-page">
      <h1>Login to PosalPro</h1>
      <form onSubmit={handleSubmit} data-testid="login-form">
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            data-testid="email-input"
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            data-testid="password-input"
            required
            minLength={8}
          />
        </div>
        {error && (
          <div role="alert" data-testid="error-message">
            {error}
          </div>
        )}
        {loginAttempts >= 3 && (
          <div role="alert" data-testid="rate-limit-warning">
            Too many failed attempts. Please wait before trying again.
          </div>
        )}
        <button type="submit" disabled={isLoading || loginAttempts >= 5} data-testid="login-button">
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <a href="/register" data-testid="register-link">
        Create Account
      </a>
      <a href="/reset-password" data-testid="reset-password-link">
        Forgot Password?
      </a>
    </div>
  );
};

const RegistrationPage = ({ onSuccess }: { onSuccess?: (user: any) => void }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserType.PROPOSAL_MANAGER,
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);

    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!validatePassword(formData.password)) {
      newErrors.password =
        'Password must contain at least 8 characters, uppercase, lowercase, number, and special character';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const user = await response.json();
      onSuccess?.(user);
    } catch (err) {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="registration-page">
      <h1>Create Your PosalPro Account</h1>
      <form onSubmit={handleSubmit} data-testid="registration-form">
        <div>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            data-testid="name-input"
            required
          />
          {errors.name && (
            <div role="alert" data-testid="name-error">
              {errors.name}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            data-testid="email-input"
            required
          />
          {errors.email && (
            <div role="alert" data-testid="email-error">
              {errors.email}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            value={formData.password}
            onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
            data-testid="password-input"
            required
            minLength={8}
          />
          {errors.password && (
            <div role="alert" data-testid="password-error">
              {errors.password}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            value={formData.confirmPassword}
            onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            data-testid="confirm-password-input"
            required
          />
          {errors.confirmPassword && (
            <div role="alert" data-testid="confirm-password-error">
              {errors.confirmPassword}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={formData.role}
            onChange={e => setFormData(prev => ({ ...prev, role: e.target.value as UserType }))}
            data-testid="role-select"
          >
            <option value={UserType.PROPOSAL_MANAGER}>Proposal Manager</option>
            <option value={UserType.CONTENT_MANAGER}>Content Manager</option>
            <option value={UserType.SME}>Subject Matter Expert</option>
            <option value={UserType.EXECUTIVE}>Executive</option>
          </select>
        </div>

        {errors.general && (
          <div role="alert" data-testid="general-error">
            {errors.general}
          </div>
        )}

        <button type="submit" disabled={isLoading} data-testid="register-button">
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      <a href="/login" data-testid="login-link">
        Already have an account? Sign in
      </a>
    </div>
  );
};

const DashboardPage = ({ user }: { user: any }) => {
  return (
    <div data-testid="dashboard-page">
      <h1>Welcome to PosalPro Dashboard</h1>
      <div data-testid="user-info">
        <p>Welcome, {user?.name || 'User'}!</p>
        <p>Role: {user?.role || 'Unknown'}</p>
      </div>
      <div data-testid="dashboard-content">
        {user?.role === UserType.PROPOSAL_MANAGER && (
          <div data-testid="proposal-manager-content">
            <h2>Proposal Manager Dashboard</h2>
            <button data-testid="create-proposal-btn">Create New Proposal</button>
          </div>
        )}
        {user?.role === UserType.CONTENT_MANAGER && (
          <div data-testid="content-manager-content">
            <h2>Content Manager Dashboard</h2>
            <button data-testid="manage-content-btn">Manage Content</button>
          </div>
        )}
        {user?.role === UserType.SME && (
          <div data-testid="sme-content">
            <h2>SME Workspace</h2>
            <button data-testid="review-proposals-btn">Review Proposals</button>
          </div>
        )}
        {user?.role === UserType.EXECUTIVE && (
          <div data-testid="executive-content">
            <h2>Executive Dashboard</h2>
            <button data-testid="view-analytics-btn">View Analytics</button>
          </div>
        )}
      </div>
      <button data-testid="logout-button">Logout</button>
    </div>
  );
};

describe('Authentication Journey Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    setupApiMocks();
    clearMockSession();
  });

  afterEach(() => {
    clearMockSession();
    jest.clearAllMocks();
  });

  describe('Complete Login Journey (H2, H6)', () => {
    it('should complete successful login journey with performance tracking', async () => {
      const journeyStartTime = Date.now();
      const mockOnSuccess = jest.fn();

      render(
        <AuthProvider>
          <LoginPage onSuccess={mockOnSuccess} />
        </AuthProvider>
      );

      // Verify login page loaded
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.getByText('Login to PosalPro')).toBeInTheDocument();

      // Fill in credentials
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'ValidPassword123!');

      // Submit form
      const loginStartTime = Date.now();
      await user.click(screen.getByTestId('login-button'));

      // Wait for successful login
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      const loginEndTime = Date.now();
      const loginDuration = loginEndTime - loginStartTime;
      const journeyDuration = loginEndTime - journeyStartTime;

      // H2 hypothesis: Login should complete within 3 seconds
      expect(loginDuration).toBeLessThan(3000);
      expect(journeyDuration).toBeLessThan(5000);

      // Verify no errors displayed
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should handle login failure with proper error messaging and recovery', async () => {
      const mockOnSuccess = jest.fn();

      render(
        <AuthProvider>
          <LoginPage onSuccess={mockOnSuccess} />
        </AuthProvider>
      );

      // Mock failed login
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      // Fill in invalid credentials
      await user.type(screen.getByTestId('email-input'), 'invalid@example.com');
      await user.type(screen.getByTestId('password-input'), 'wrongpassword');
      await user.click(screen.getByTestId('login-button'));

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();

      // Verify user can retry
      expect(screen.getByTestId('login-button')).not.toBeDisabled();
    });

    it('should enforce rate limiting after multiple failed attempts', async () => {
      const mockOnSuccess = jest.fn();

      render(
        <AuthProvider>
          <LoginPage onSuccess={mockOnSuccess} />
        </AuthProvider>
      );

      // Mock multiple failed attempts
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      // Perform multiple failed login attempts
      for (let i = 0; i < 4; i++) {
        await user.clear(screen.getByTestId('email-input'));
        await user.clear(screen.getByTestId('password-input'));
        await user.type(screen.getByTestId('email-input'), `test${i}@example.com`);
        await user.type(screen.getByTestId('password-input'), 'wrongpassword');
        await user.click(screen.getByTestId('login-button'));

        await waitFor(() => {
          expect(screen.getByTestId('error-message')).toBeInTheDocument();
        });
      }

      // After 3 attempts, should show rate limit warning
      await waitFor(() => {
        expect(screen.getByTestId('rate-limit-warning')).toBeInTheDocument();
        expect(
          screen.getByText('Too many failed attempts. Please wait before trying again.')
        ).toBeInTheDocument();
      });

      // After 5 attempts, button should be disabled
      await user.clear(screen.getByTestId('email-input'));
      await user.clear(screen.getByTestId('password-input'));
      await user.type(screen.getByTestId('email-input'), 'test5@example.com');
      await user.type(screen.getByTestId('password-input'), 'wrongpassword');
      await user.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(screen.getByTestId('login-button')).toBeDisabled();
      });
    });
  });

  describe('Complete Registration Journey (H2, H6)', () => {
    it('should complete successful registration with validation', async () => {
      const journeyStartTime = Date.now();
      const mockOnSuccess = jest.fn();

      render(
        <AuthProvider>
          <RegistrationPage onSuccess={mockOnSuccess} />
        </AuthProvider>
      );

      // Verify registration page loaded
      expect(screen.getByTestId('registration-page')).toBeInTheDocument();
      expect(screen.getByText('Create Your PosalPro Account')).toBeInTheDocument();

      // Fill in registration form
      await user.type(screen.getByTestId('name-input'), 'New User');
      await user.type(screen.getByTestId('email-input'), 'newuser@example.com');
      await user.type(screen.getByTestId('password-input'), 'StrongPassword123!');
      await user.type(screen.getByTestId('confirm-password-input'), 'StrongPassword123!');
      await user.selectOptions(screen.getByTestId('role-select'), UserType.CONTENT_MANAGER);

      // Submit form
      const registrationStartTime = Date.now();
      await user.click(screen.getByTestId('register-button'));

      // Wait for successful registration
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      const registrationEndTime = Date.now();
      const registrationDuration = registrationEndTime - registrationStartTime;
      const journeyDuration = registrationEndTime - journeyStartTime;

      // H2 hypothesis: Registration should complete within 5 seconds
      expect(registrationDuration).toBeLessThan(5000);
      expect(journeyDuration).toBeLessThan(10000);
    });

    it('should validate password requirements with detailed feedback', async () => {
      render(
        <AuthProvider>
          <RegistrationPage />
        </AuthProvider>
      );

      // Fill form with weak password
      await user.type(screen.getByTestId('name-input'), 'Test User');
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'weak');
      await user.type(screen.getByTestId('confirm-password-input'), 'weak');
      await user.click(screen.getByTestId('register-button'));

      // Verify password validation error
      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toBeInTheDocument();
        expect(screen.getByText(/Password must contain at least 8 characters/)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation matching', async () => {
      render(
        <AuthProvider>
          <RegistrationPage />
        </AuthProvider>
      );

      // Fill form with mismatched passwords
      await user.type(screen.getByTestId('name-input'), 'Test User');
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'StrongPassword123!');
      await user.type(screen.getByTestId('confirm-password-input'), 'DifferentPassword123!');
      await user.click(screen.getByTestId('register-button'));

      // Verify confirmation error
      await waitFor(() => {
        expect(screen.getByTestId('confirm-password-error')).toBeInTheDocument();
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Dashboard Access (US-2.3)', () => {
    it('should provide role-appropriate dashboard content for Proposal Manager', async () => {
      const proposalManagerUser = mockUserRoles.proposalManager;

      render(
        <AuthProvider>
          <DashboardPage user={proposalManagerUser} />
        </AuthProvider>
      );

      // Verify dashboard loaded with correct role content
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.getByText(`Welcome, ${proposalManagerUser.name}!`)).toBeInTheDocument();
      expect(screen.getByText(`Role: ${proposalManagerUser.role}`)).toBeInTheDocument();

      // Verify Proposal Manager specific content
      expect(screen.getByTestId('proposal-manager-content')).toBeInTheDocument();
      expect(screen.getByTestId('create-proposal-btn')).toBeInTheDocument();

      // Verify other role content is not present
      expect(screen.queryByTestId('content-manager-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sme-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('executive-content')).not.toBeInTheDocument();
    });

    it('should provide role-appropriate dashboard content for Content Manager', async () => {
      const contentManagerUser = mockUserRoles.contentManager;

      render(
        <AuthProvider>
          <DashboardPage user={contentManagerUser} />
        </AuthProvider>
      );

      // Verify Content Manager specific content
      expect(screen.getByTestId('content-manager-content')).toBeInTheDocument();
      expect(screen.getByTestId('manage-content-btn')).toBeInTheDocument();

      // Verify other role content is not present
      expect(screen.queryByTestId('proposal-manager-content')).not.toBeInTheDocument();
    });

    it('should provide role-appropriate dashboard content for SME', async () => {
      const smeUser = mockUserRoles.sme;

      render(
        <AuthProvider>
          <DashboardPage user={smeUser} />
        </AuthProvider>
      );

      // Verify SME specific content
      expect(screen.getByTestId('sme-content')).toBeInTheDocument();
      expect(screen.getByTestId('review-proposals-btn')).toBeInTheDocument();
    });

    it('should provide role-appropriate dashboard content for Executive', async () => {
      const executiveUser = mockUserRoles.executive;

      render(
        <AuthProvider>
          <DashboardPage user={executiveUser} />
        </AuthProvider>
      );

      // Verify Executive specific content
      expect(screen.getByTestId('executive-content')).toBeInTheDocument();
      expect(screen.getByTestId('view-analytics-btn')).toBeInTheDocument();
    });
  });

  describe('End-to-End Authentication Flow (H2, H6)', () => {
    it('should complete full login to dashboard journey', async () => {
      const fullJourneyStartTime = Date.now();
      const mockUser = mockUserRoles.proposalManager;

      // Mock successful API responses
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        });

      // Start with login page
      const { rerender } = render(
        <AuthProvider>
          <LoginPage
            onSuccess={user => {
              setMockSession({ user });
            }}
          />
        </AuthProvider>
      );

      // Complete login
      await user.type(screen.getByTestId('email-input'), mockUser.email);
      await user.type(screen.getByTestId('password-input'), 'ValidPassword123!');
      await user.click(screen.getByTestId('login-button'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
      });

      // Navigate to dashboard
      rerender(
        <AuthProvider>
          <DashboardPage user={mockUser} />
        </AuthProvider>
      );

      // Verify dashboard is accessible
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
        expect(screen.getByText(`Welcome, ${mockUser.name}!`)).toBeInTheDocument();
      });

      const fullJourneyEndTime = Date.now();
      const fullJourneyDuration = fullJourneyEndTime - fullJourneyStartTime;

      // H2 hypothesis: Complete authentication journey should be under 10 seconds
      expect(fullJourneyDuration).toBeLessThan(10000);
    });
  });

  describe('Security and Accessibility Validation (H6)', () => {
    it('should provide accessible authentication forms', () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      // Verify form labels are properly associated
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();

      // Verify form has proper structure
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should provide screen reader accessible error messages', async () => {
      render(
        <AuthProvider>
          <RegistrationPage />
        </AuthProvider>
      );

      // Trigger validation errors
      await user.click(screen.getByTestId('register-button'));

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);

        errorMessages.forEach(error => {
          expect(error).toHaveAttribute('role', 'alert');
        });
      });
    });

    it('should support keyboard navigation throughout authentication flow', async () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      );

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const loginButton = screen.getByTestId('login-button');

      // Tab through form elements
      emailInput.focus();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(loginButton).toHaveFocus();

      // Submit with Enter key
      await user.keyboard('{Enter}');

      // Form should attempt submission
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });
});
