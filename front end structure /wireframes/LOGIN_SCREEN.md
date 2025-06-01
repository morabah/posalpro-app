# Login Screen - Refined Layout

## Selected Design: Version B (Split Panel)

```
+------------------------+------------------------+
|                        |                        |
|                        |                        |
|                        |     POSALPRO           |
|                        |                        |
|                        |  Welcome Back          |
|   [ILLUSTRATION:       |                        |
|    Proposal            |  Email                 |
|    Collaboration       |  +----------------+    |
|    Visual]             |  |user@example.com|    |
|                        |  +----------------+    |
|                        |                        |
|    "Streamline your    |  Password               |
|    proposal workflow   |  +----------------+    |
|    with AI-powered     |  |••••••••••••••••|    |
|    collaboration"      |  +----------------+    |
|                        |                        |
|                        |  Role                  |
|                        |  +----------------+    |
|                        |  |Proposal Manager▼|   |
|                        |  +----------------+    |
|                        |                        |
|                        |  [    Sign In     ]    |
|                        |                        |
|                        |  Forgot password?      |
|                        |                        |
+------------------------+------------------------+
```

### Error State

```
+------------------------+------------------------+
|                        |                        |
|                        |                        |
|                        |     POSALPRO           |
|                        |                        |
|                        |  Welcome Back          |
|   [ILLUSTRATION:       |                        |
|    Proposal            |  ⚠️ Invalid credentials. Please try again.|
|    Collaboration       |                        |
|    Visual]             |  Email                 |
|                        |  +----------------+    |
|                        |  |user@example.com|    |
|                        |  +----------------+    |
|                        |                        |
|    "Streamline your    |  Password               |
|    proposal workflow   |  +----------------+    |
|    with AI-powered     |  |                |    |
|    collaboration"      |  +----------------+    |
|                        |  Field is required     |
|                        |                        |
|                        |  Role                  |
|                        |  +----------------+    |
|                        |  |Select a role   ▼|   |
|                        |  +----------------+    |
|                        |                        |
|                        |  [    Sign In     ]    |
|                        |                        |
|                        |  Forgot password?      |
|                        |                        |
+------------------------+------------------------+
```

### Loading State

```
+------------------------+------------------------+
|                        |                        |
|                        |                        |
|                        |     POSALPRO           |
|                        |                        |
|                        |  Welcome Back          |
|   [ILLUSTRATION:       |                        |
|    Proposal            |  Email                 |
|    Collaboration       |  +----------------+    |
|    Visual]             |  |user@example.com|    |
|                        |  +----------------+    |
|                        |                        |
|    "Streamline your    |  Password               |
|    proposal workflow   |  +----------------+    |
|    with AI-powered     |  |••••••••••••••••|    |
|    collaboration"      |  +----------------+    |
|                        |                        |
|                        |  Role                  |
|                        |  +----------------+    |
|                        |  |Proposal Manager▼|   |
|                        |  +----------------+    |
|                        |                        |
|                        |  [  Signing In... ⟳ ]  |
|                        |                        |
|                        |  Forgot password?      |
|                        |                        |
+------------------------+------------------------+
```

### Specifications

#### Typography

- **Welcome Back**: 24px, SemiBold
- **Form Labels**: 14px, Medium
- **Button Text**: 16px, Medium
- **Error Messages**: 14px, Regular, Error Red
- **Help Text**: 14px, Regular

#### Spacing

- 24px padding around form content
- 16px vertical spacing between form elements
- 8px spacing between label and input

#### Form Elements

- Input height: 40px
- Button height: 44px
- Border radius: 6px on all elements

#### Colors

- Primary action button: Brand Blue (#2563EB)
- Error state: Error Red (#EF4444)
- Form borders: Light Gray (#E2E8F0)
- Background: White (#FFFFFF)
- Text: Dark Gray (#1E293B)

#### Interaction Notes

- Email field has email validation
- Password field has minimum length validation (8 characters)
- Role dropdown requires selection
- Submit button is disabled until all fields are valid
- Form remembers email and role selection across sessions
- Tab order: Email → Password → Role → Sign In → Forgot Password

#### Accessibility

- All form elements have associated labels
- Error messages are announced by screen readers
- Color is not the only indicator of errors (icons used)
- Focus states are clearly visible
- Keyboard navigation fully supported
