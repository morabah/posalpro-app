#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Customer Data Integrity Tests
 * Tests data consistency, chronological order, and customer data validation
 */

import { ApiClient } from './api-client';

export class DataIntegrityTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔒 Testing Customer Data Integrity');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Customer records maintain chronological creation order',
        test: async () => {
          const res = await this.api.request('GET', '/api/customers?sortBy=createdAt&sortOrder=desc&limit=20');
          const data = await res.json();

          if (data.data && data.data.items && data.data.items.length > 1) {
            const items = data.data.items;
            // When sorted by createdAt desc, each item should be older than the previous
            for (let i = 1; i < items.length; i++) {
              const prev = new Date(items[i - 1].createdAt);
              const curr = new Date(items[i].createdAt);
              if (prev < curr) {
                throw new Error('Customer records not in chronological order (newest first)');
              }
            }
            return {
              checked: items.length,
              chronological: true,
              sortOrder: 'newest first',
              dateRange: `${items[items.length - 1]?.createdAt} to ${items[0]?.createdAt}`
            };
          }
          return { checked: 0, reason: 'Insufficient customer data for chronological test' };
        },
      },
      {
        name: 'Customer email addresses are unique',
        test: async () => {
          const res = await this.api.request('GET', '/api/customers?limit=100');
          const data = await res.json();

          if (!data.data || !data.data.items || data.data.items.length < 2) {
            return { status: 'SKIP', reason: 'Insufficient customer data for uniqueness test' };
          }

          const customers = data.data.items;
          const emails = customers.map((c: any) => c.email).filter(Boolean);
          const uniqueEmails = new Set(emails);

          if (emails.length !== uniqueEmails.size) {
            const duplicates = emails.filter((email: string, index: number) => emails.indexOf(email) !== index);
            throw new Error(`Duplicate email addresses found: ${duplicates.join(', ')}`);
          }

          return {
            customerCount: customers.length,
            uniqueEmails: uniqueEmails.size,
            noDuplicates: true,
            emailDomains: [...new Set(emails.map((email: string) => email.split('@')[1]))].length
          };
        },
      },
      {
        name: 'Customer status values are valid',
        test: async () => {
          const res = await this.api.request('GET', '/api/customers?limit=50');
          const data = await res.json();

          if (!data.data || !data.data.items || data.data.items.length === 0) {
            return { status: 'SKIP', reason: 'No customer data available for status validation' };
          }

          const customers = data.data.items;
          const validStatuses = ['ACTIVE', 'INACTIVE', 'LEAD', 'PROSPECT'];
          const statusCounts: Record<string, number> = {};

          let invalidStatuses = 0;
          let totalCustomers = 0;

          customers.forEach((customer: any) => {
            totalCustomers++;
            const status = customer.status;
            if (status) {
              if (validStatuses.includes(status)) {
                statusCounts[status] = (statusCounts[status] || 0) + 1;
              } else {
                invalidStatuses++;
              }
            }
          });

          if (invalidStatuses > 0) {
            throw new Error(`Found ${invalidStatuses} customers with invalid status values`);
          }

          return {
            totalCustomers,
            validStatuses: Object.keys(statusCounts).length,
            statusDistribution: statusCounts,
            statusValidationPassed: invalidStatuses === 0
          };
        },
      },
      {
        name: 'Customer company data consistency',
        test: async () => {
          const res = await this.api.request('GET', '/api/customers?limit=30');
          const data = await res.json();

          if (!data.data || !data.data.items || data.data.items.length === 0) {
            return { status: 'SKIP', reason: 'No customer data available for company validation' };
          }

          const customers = data.data.items;
          let companiesWithData = 0;
          let companiesWithWebsite = 0;
          let companiesWithIndustry = 0;
          let companiesWithSize = 0;

          customers.forEach((customer: any) => {
            if (customer.name) {
              companiesWithData++;
              if (customer.website) companiesWithWebsite++;
              if (customer.industry) companiesWithIndustry++;
              if (customer.companySize) companiesWithSize++;
            }
          });

          const websiteCompleteness = companiesWithData > 0 ? Math.round((companiesWithWebsite / companiesWithData) * 100) : 0;
          const industryCompleteness = companiesWithData > 0 ? Math.round((companiesWithIndustry / companiesWithData) * 100) : 0;
          const sizeCompleteness = companiesWithData > 0 ? Math.round((companiesWithSize / companiesWithData) * 100) : 0;

          return {
            totalCompanies: companiesWithData,
            websiteCompleteness: `${websiteCompleteness}%`,
            industryCompleteness: `${industryCompleteness}%`,
            sizeCompleteness: `${sizeCompleteness}%`,
            averageCompleteness: Math.round((websiteCompleteness + industryCompleteness + sizeCompleteness) / 3)
          };
        },
      },
      {
        name: 'Customer contact information validation',
        test: async () => {
          const res = await this.api.request('GET', '/api/customers?limit=40');
          const data = await res.json();

          if (!data.data || !data.data.items || data.data.items.length === 0) {
            return { status: 'SKIP', reason: 'No customer data available for contact validation' };
          }

          const customers = data.data.items;
          let validEmails = 0;
          let validPhones = 0;
          let validWebsites = 0;
          let totalContacts = 0;

          customers.forEach((customer: any) => {
            totalContacts++;
            if (customer.email) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (emailRegex.test(customer.email)) validEmails++;
            }
            if (customer.phone) {
              const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
              if (phoneRegex.test(customer.phone.replace(/[\s\-\(\)]/g, ''))) validPhones++;
            }
            if (customer.website) {
              try {
                new URL(customer.website);
                validWebsites++;
              } catch {
                // Invalid URL
              }
            }
          });

          const emailValidityRate = totalContacts > 0 ? Math.round((validEmails / customers.filter((c: any) => c.email).length) * 100) : 0;
          const phoneValidityRate = totalContacts > 0 ? Math.round((validPhones / customers.filter((c: any) => c.phone).length) * 100) : 0;
          const websiteValidityRate = totalContacts > 0 ? Math.round((validWebsites / customers.filter((c: any) => c.website).length) * 100) : 0;

          return {
            totalContacts,
            validEmails,
            validPhones,
            validWebsites,
            emailValidityRate: `${emailValidityRate}%`,
            phoneValidityRate: `${phoneValidityRate}%`,
            websiteValidityRate: `${websiteValidityRate}%`,
            overallContactQuality: Math.round((emailValidityRate + phoneValidityRate + websiteValidityRate) / 3)
          };
        },
      },
    ];

    const results = [];

    for (const { name, test } of tests) {
      const start = Date.now();
      try {
        const result = await test();
        results.push({
          test: name,
          status: 'PASS',
          duration: Date.now() - start,
          result,
        });
      } catch (error: any) {
        results.push({
          test: name,
          status: 'FAIL',
          duration: Date.now() - start,
          error: error.message,
        });
      }
    }

    return results;
  }
}
