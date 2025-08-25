/**
 * PosalPro MVP2 - Customer Profile Management
 * Based on CUSTOMER_PROFILE_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H4 hypothesis validation
 */

import { CustomerProfileClient } from './CustomerProfileClient';

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <CustomerProfileClient customerId={id} />;
}
