# PosalPro MVP2 - Application

## 🎯 Project Overview

PosalPro MVP2 is an AI-assisted development platform with systematic learning
capture and knowledge preservation. This Next.js application provides the user
interface and core functionality for the platform.

**Technology Stack:**

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- ESLint for code quality

**Platform Context:**

- Built using platform engineering golden paths
- Integrated with Internal Developer Platform (IDP)
- Systematic learning capture and documentation-driven development

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn package manager
- Git

### Installation & Setup

1. **Clone and Setup**

   ```bash
   # If cloning fresh (already initialized in this case)
   git clone <repository-url>
   cd posalpro-app

   # Install dependencies
   npm install
   ```

2. **Environment Configuration**

   ```bash
   # Copy environment template (when available)
   cp .env.example .env.local

   # Edit environment variables as needed
   nano .env.local
   ```

3. **Run Development Server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open Application** Navigate to
   [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📁 Project Structure

```
posalpro-app/
├── src/
│   └── app/           # Next.js App Router pages
│       ├── page.tsx   # Home page
│       ├── layout.tsx # Root layout
│       └── globals.css # Global styles
├── public/            # Static assets
├── docs/              # Project documentation (symlinked from parent)
├── platform/          # Platform engineering configs (symlinked from parent)
└── ...config files
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Code Quality

- **ESLint**: Configured with Next.js recommended rules
- **TypeScript**: Strict type checking enabled
- **Tailwind CSS**: Utility-first CSS framework
- **Git Hooks**: Pre-commit hooks for code quality (to be configured)

---

## 🏗️ Platform Integration

This application is built using the PosalPro platform engineering foundation:

### Golden Path Templates

- Follows platform engineering best practices
- Standardized project structure and configuration
- Integrated with platform metrics and monitoring

### Documentation Links

- [Project Reference](../PROJECT_REFERENCE.md) - Central navigation hub
- [Platform Engineering Guide](../docs/guides/platform-engineering-foundation-guide.md) -
  IDP implementation
- [AI Development Patterns](../PROMPT_PATTERNS.md) - AI-assisted development
  patterns
- [Lessons Learned](../LESSONS_LEARNED.md) - Project insights and wisdom

---

## 🔧 Configuration

### Environment Variables

Create `.env.local` for local development:

```bash
# API Configuration (when available)
NEXT_PUBLIC_API_URL=http://localhost:3001
API_SECRET=your-api-secret

# Database Configuration (when available)
DATABASE_URL=your-database-url

# Monitoring & Analytics (when available)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### TypeScript Configuration

- Strict mode enabled
- Path aliases configured (`@/*` for `src/*`)
- Next.js TypeScript plugin included

---

## 📊 Monitoring & Metrics

### Performance Monitoring

- Next.js built-in performance metrics
- Web Vitals tracking (to be implemented)
- Platform DX metrics integration

### Development Experience

- Hot reload and fast refresh
- TypeScript error reporting
- ESLint integration with editor

---

## 🚀 Deployment

### Platform Deployment

This application will be deployed using the platform's golden path templates:

- Automated CI/CD pipeline
- Infrastructure as Code
- Monitoring and observability
- Cost optimization

### Manual Deployment

```bash
# Build application
npm run build

# Deploy to Vercel (alternative)
npm install -g vercel
vercel deploy
```

---

## 🤝 Contributing

### Development Workflow

1. Reference [AI Development Patterns](../PROMPT_PATTERNS.md) for AI-assisted
   development
2. Follow platform engineering guidelines
3. Update documentation as you develop
4. Capture learnings in [LESSONS_LEARNED.md](../LESSONS_LEARNED.md)

### Code Standards

- Follow ESLint configuration
- Use TypeScript strictly
- Follow Next.js best practices
- Maintain platform engineering patterns

---

## 📚 Learn More

### Next.js Resources

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - Interactive Next.js tutorial
- [Next.js GitHub](https://github.com/vercel/next.js) - Source code and
  contributions

### Platform Resources

- [Platform Engineering Foundation](../docs/guides/platform-engineering-foundation-guide.md)
- [Developer Experience Metrics](../platform/metrics/developer-experience/)
- [Cost Optimization](../platform/services/cost-optimization/)

---

**Built with ❤️ using platform engineering best practices and AI-assisted
development patterns.**
