# Database Seed Data Usage Guide

## 🎯 **Overview**

The database seed script creates comprehensive test data for QA testing and
development. It includes users, roles, customers, products, content, and
proposals with realistic relationships.

## 🚀 **Quick Start**

### **Run the Seed Script**

```bash
# Seed the database with test data
npm run db:seed

# Or reset and seed (WARNING: destroys all data)
npm run db:reset

# If you need customers first (for existing DB):
npx tsx scripts/add-test-customers.ts

# Check what data was created:
npx tsx scripts/check-data-counts.ts
```

### **Check Seed Status**

```bash
# Verify the seed ran successfully
npm run app:cli db user count
npm run app:cli db proposal count
```

## 👥 **Test Users Created**

### **Production Users**

| Email                   | Role                 | Department           |
| ----------------------- | -------------------- | -------------------- |
| `admin@posalpro.com`    | System Administrator | IT                   |
| `ceo@posalpro.com`      | Executive            | Executive            |
| `pm1@posalpro.com`      | Proposal Manager     | Business Development |
| `pm2@posalpro.com`      | Proposal Manager     | Business Development |
| `sme1@posalpro.com`     | Senior SME           | Technology           |
| `sme2@posalpro.com`     | SME                  | Engineering          |
| `sme3@posalpro.com`     | SME                  | Security             |
| `content1@posalpro.com` | Content Manager      | Marketing            |
| `content2@posalpro.com` | Content Manager      | Documentation        |

### **QA Test Users**

| Email                     | Role                 | Department |
| ------------------------- | -------------------- | ---------- |
| `demo@posalpro.com`       | Proposal Manager     | Demo       |
| `qa.manager@posalpro.com` | Proposal Manager     | QA         |
| `qa.sme@posalpro.com`     | SME                  | QA         |
| `qa.content@posalpro.com` | Content Manager      | QA         |
| `qa.admin@posalpro.com`   | System Administrator | QA         |

### **Default Password**

```
ProposalPro2024!
```

## 🏢 **Sample Data Created**

### **Customers (5)**

- Al Noor Technologies (Technology, Enterprise)
- Al Quds Financial (Financial Services, Enterprise)
- Shifa Health Innovations (Healthcare, Premium)
- Al Hadid Manufacturing (Manufacturing, Standard)
- Al Ilm Education Systems (Education, Standard)

### **Products (7)**

- Sahab Cloud Platform (Cloud Infrastructure)
- Bayan Analytics Suite (Analytics)
- Amn Security Monitoring (Security)
- Rabt Data Integration (Data Management)
- Jawwal Mobile Framework (Development Tools)
- Raqib IoT Management (IoT)
- And more...

### **Proposals (9)**

- Won proposals (ACCEPTED status)
- Active proposals (IN_REVIEW, PENDING_APPROVAL)
- Overdue proposals (for risk indicators)
- Draft proposals (pipeline)

### **Content Items (6)**

- Executive Summary Template
- Technical Architecture Overview
- Security Compliance Framework
- Cost Benefit Analysis Template
- Implementation Timeline Template

## 📊 **Data Relationships**

### **Role-Based Access**

- Each user has appropriate permissions based on their role
- System Administrator: Full access
- Proposal Manager: Proposal and team management
- SME: Content and validation access
- Content Manager: Content creation and management

### **Proposal Teams**

- Each proposal has assigned team members
- Team Lead, Sales Representative, Subject Matter Experts
- Realistic team compositions for testing

### **Product Relationships**

- Products have relationships (recommends, requires, etc.)
- Validation rules for compatibility checking

## 🧪 **QA Testing Scenarios**

### **Authentication Testing**

```bash
# Test different user roles
npm run app:cli login qa.manager@posalpro.com ProposalPro2024!
npm run app:cli login qa.sme@posalpro.com ProposalPro2024!
npm run app:cli login qa.admin@posalpro.com ProposalPro2024!
```

### **Permission Testing**

```bash
# Test role-based permissions
npm run app:cli rbac try GET /api/proposals qa.manager@posalpro.com
npm run app:cli rbac try POST /api/proposals qa.sme@posalpro.com
```

### **Data Validation**

```bash
# Check data integrity
npm run app:cli db proposal count '{"where":{"status":"ACCEPTED"}}'
npm run app:cli db user count '{"where":{"department":"Quality Assurance"}}'
```

## 📈 **Analytics & Reporting**

### **Proposal Funnel**

- **Won**: 3 proposals (ACCEPTED status)
- **In Review**: 2 proposals (IN_REVIEW status)
- **Draft**: 2 proposals (DRAFT status)
- **Overdue**: 1 proposal (overdue by 5 days)

### **Team Performance**

- Multiple users assigned to proposals
- Different roles represented in teams
- Realistic workload distribution

## 🔧 **Customization**

### **Adding More Users**

```typescript
// In prisma/seed.ts, add to usersData array
{
  email: 'new.user@posalpro.com',
  name: 'New User',
  password: defaultPassword,
  department: 'Engineering',
  status: 'ACTIVE',
  roleName: 'SME',
}
```

### **Adding More Customers**

```typescript
// In prisma/seed.ts, add to customersData array
{
  name: 'New Company Inc',
  email: 'contact@newcompany.com',
  industry: 'Technology',
  tier: 'STANDARD',
  status: 'ACTIVE',
  // ... contacts
}
```

## 🗂️ **Data Export/Import**

### **Export Seed Data**

```bash
# Export users for backup
npm run app:cli export users --format=json

# Export proposals with relationships
npm run app:cli export proposals --format=json --include=assignedTo,products
```

### **Import Additional Data**

```bash
# Import custom test data
npm run app:cli import users path/to/users.json
npm run app:cli import customers path/to/customers.json
```

## 📋 **Verification Checklist**

After running `npm run db:seed`, verify:

- [ ] **Users**: 14 users created (9 production + 5 QA)
- [ ] **Roles**: 6 roles with proper permissions
- [ ] **Customers**: 5 customers with contacts
- [ ] **Products**: 7 products with relationships
- [ ] **Proposals**: 9 proposals in various states
- [ ] **Content**: 6 templates and documents
- [ ] **Assignments**: Team members assigned to proposals
- [ ] **Relationships**: Product and user relationships established

## 🚀 **Production Deployment**

### **Seed Production Database**

```bash
# For production deployment
npm run db:seed

# Verify data integrity
npm run app:cli health:db
npm run app:cli db user count
```

### **Backup Before Seeding**

```bash
# Backup existing data (if any)
npm run db:backup

# Then seed
npm run db:seed
```

---

**🎉 Your database is now seeded with comprehensive QA test data!**

**Quick login test:**

```bash
npm run app:cli login demo@posalpro.com ProposalPro2024!
```

**Check data:**

```bash
npm run app:cli db proposal count
npm run app:cli db user count
```
