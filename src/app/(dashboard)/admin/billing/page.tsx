"use client";

import { useEffect, useState } from 'react';

type SubscriptionDTO = {
  id: string;
  status: string;
  seats: number;
  plan: { id: string; name: string; tier: 'FREE' | 'PRO' | 'ENTERPRISE' };
} | null;

export default function AdminBillingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionDTO>(null);
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [seats, setSeats] = useState<number>(5);
  const [planName, setPlanName] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enforceSubscription, setEnforceSubscription] = useState<boolean>(false);
  const [enforceSeats, setEnforceSeats] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/billing/subscription', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Failed to load billing data');
        if (!mounted) return;
        setSubscription(json.data.subscription);
        setStripeCustomerId(json.data.stripeCustomerId);
        setEntitlements(json.data.entitlements || []);
        if (json.data.enforcement) {
          setEnforceSubscription(Boolean(json.data.enforcement.subscription));
          setEnforceSeats(Boolean(json.data.enforcement.seats));
        }
        if (json.data.subscription) {
          setSeats(json.data.subscription.seats);
          setPlanName(json.data.subscription.plan.tier);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Error loading billing data');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/billing/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName, seats }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to update subscription');
      setSubscription(json.data.subscription);
      setEntitlements(json.data.entitlements || []);
      setMessage('Subscription updated');
    } catch (e: any) {
      setError(e?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function openBillingPortal() {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json?.url) {
        throw new Error(json?.message || 'Unable to open billing portal');
      }
      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message || 'Failed to open billing portal');
    }
  }

  return (
    <div className="p-4 max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">Billing & Entitlements</h1>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="rounded border border-red-300 bg-red-50 text-red-800 p-3">{error}</div>
          )}
          {message && (
            <div className="rounded border border-green-300 bg-green-50 text-green-800 p-3">{message}</div>
          )}

          <section className="rounded border p-4">
            <h2 className="font-medium mb-3">Subscription</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Plan</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={planName}
                  onChange={e => setPlanName(e.target.value as any)}
                >
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Seats</label>
                <input
                  type="number"
                  min={1}
                  className="w-full border rounded px-2 py-1"
                  value={seats}
                  onChange={e => setSeats(Number(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                onClick={save}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-100 border"
                onClick={openBillingPortal}
                disabled={!stripeCustomerId}
                title={!stripeCustomerId ? 'Customer not mapped yet' : ''}
              >
                Manage Billing in Stripe
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <div>Status: {subscription?.status || 'N/A'}</div>
              <div>Stripe Customer: {stripeCustomerId || '—'}</div>
              <div>
                Stripe Subscription: {subscription && (subscription as any).stripeSubscriptionId ? (subscription as any).stripeSubscriptionId : '—'}
              </div>
            </div>
          </section>

          <section className="rounded border p-4">
            <h2 className="font-medium mb-3">Server Enforcement</h2>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-gray-900">Subscription Enforcement</div>
                <div className="text-xs text-gray-600">Blocks non‑active tenants when enabled</div>
              </div>
              <label className="inline-flex items-center cursor-not-allowed opacity-70">
                <input type="checkbox" className="sr-only" checked={enforceSubscription} readOnly />
                <span
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                    enforceSubscription ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                      enforceSubscription ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </span>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-gray-900">Seat Enforcement</div>
                <div className="text-xs text-gray-600">Blocks usage when seats are exceeded</div>
              </div>
              <label className="inline-flex items-center cursor-not-allowed opacity-70">
                <input type="checkbox" className="sr-only" checked={enforceSeats} readOnly />
                <span
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                    enforceSeats ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                      enforceSeats ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              These toggles reflect server configuration (read‑only). Update env vars SUBSCRIPTION_ENFORCEMENT/SEAT_ENFORCEMENT to change.
            </p>
          </section>

          <section className="rounded border p-4">
            <h2 className="font-medium mb-3">Active Entitlements</h2>
            {entitlements.length === 0 ? (
              <div className="text-sm text-gray-600">No entitlements enabled.</div>
            ) : (
              <ul className="list-disc pl-5 text-sm">
                {entitlements.map(k => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
