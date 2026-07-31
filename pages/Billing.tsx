import React, { useEffect, useState } from 'react';
import { Button, Input } from '../components/UI';
import { apiFetch } from '../hooks/useAppData';

export default function Billing({ t, user, refreshUser }: any) {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [assignedCoupons, setAssignedCoupons] = useState<any[]>([]);
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [sub, planRes] = await Promise.all([
        apiFetch('/billing/subscription'),
        apiFetch('/billing/plans'),
      ]);
      setSubscription(sub);
      setPlans((planRes as any).plans || []);
      if (user?.isOwner) {
        try {
          const couponsRes = await apiFetch('/billing/coupons');
          setAssignedCoupons((couponsRes as any).coupons || []);
        } catch {
          setAssignedCoupons([]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load billing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (params.get('billing') === 'return' && ref) {
      (async () => {
        try {
          const status = await apiFetch(`/billing/payments/${encodeURIComponent(ref)}/status`);
          setMessage(`Payment status: ${(status as any).status}`);
          const isProd = typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD;
          if ((status as any).status === 'pending' && !isProd) {
            await apiFetch(`/billing/payments/${encodeURIComponent(ref)}/simulate-success`, { method: 'POST' });
            setMessage(t('paymentSimulated'));
          }
          await load();
          if (refreshUser) await refreshUser();
        } catch (err: any) {
          setError(err.message);
        } finally {
          window.history.replaceState({}, '', window.location.pathname);
        }
      })();
    }
  }, []);

  const applyCoupon = async (planId: string) => {
    setError('');
    setMessage('');
    if (!couponCode.trim()) {
      setAppliedCoupon(null);
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch('/billing/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ couponCode: couponCode.trim(), planId, billingPeriod: period }),
      });
      setAppliedCoupon({ ...(res as any), planId });
      setMessage((res as any).message || t('couponApplied'));
    } catch (err: any) {
      setAppliedCoupon(null);
      setError(err.message || t('couponInvalid'));
    } finally {
      setBusy(false);
    }
  };

  const checkout = async (planId: string) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const body: any = { planId, billingPeriod: period };
      if (couponCode.trim()) body.couponCode = couponCode.trim();
      const res = await apiFetch('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify(body),
      }) as { paymentAuthUrl?: string; activated?: boolean; amount?: number };

      if (res.activated) {
        setMessage(t('couponCheckoutActivated'));
        setAppliedCoupon(null);
        setCouponCode('');
        await load();
        if (refreshUser) await refreshUser();
        return;
      }
      if (res.paymentAuthUrl) {
        window.location.href = res.paymentAuthUrl;
        return;
      }
      setError('No payment URL returned');
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">{t('pleaseWait')}</div>;

  const paidPlans = plans.filter((p) => p.id !== 'free');
  const canCheckout = subscription?.canCheckoutAnytime || subscription?.inRenewalWindow;
  const previewPlanId = paidPlans[0]?.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('billing')}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{t('billingSubtitle')}</p>
      </div>

      {subscription?.status === 'probation' && (
        <div className="rounded-lg border border-amber-600/50 bg-amber-900/30 text-amber-100 p-4 text-sm">
          {t('probationBanner')}
        </div>
      )}

      {error && <div className="text-sm text-red-400">{error}</div>}
      {message && <div className="text-sm text-green-400">{message}</div>}

      {subscription && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-lg mb-3">{t('currentPlan')}</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-500">{t('plan')}</dt><dd className="font-medium">{subscription.planName || subscription.planId}</dd></div>
            <div><dt className="text-gray-500">{t('status')}</dt><dd className="font-medium">{subscription.status}</dd></div>
            <div><dt className="text-gray-500">{t('userManagement')}</dt><dd>{subscription.usage?.users ?? '—'} / {subscription.maxUsers >= 1e9 ? '∞' : subscription.maxUsers}</dd></div>
            <div><dt className="text-gray-500">{t('allLocations')}</dt><dd>{subscription.usage?.locations ?? '—'} / {subscription.maxLocations >= 1e9 ? '∞' : subscription.maxLocations}</dd></div>
            {subscription.planId !== 'free' && (
              <div className="col-span-2">
                <dt className="text-gray-500">{t('dueDate')}</dt>
                <dd className="font-medium">{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : '—'}</dd>
              </div>
            )}
          </dl>
          {!canCheckout && subscription.planId !== 'free' && subscription.status === 'active' && (
            <p className="text-xs text-gray-500 mt-3">{t('renewalWindowHint')}</p>
          )}
        </div>
      )}

      {user?.isOwner && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold text-lg">{t('choosePlan')}</h2>
            <select
              className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as any);
                setAppliedCoupon(null);
              }}
            >
              <option value="monthly">{t('monthly')}</option>
              <option value="quarterly">{t('quarterly')}</option>
              <option value="yearly">{t('yearly')}</option>
            </select>
          </div>

          <div className="mb-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <div className="flex-1 w-full">
                <Input
                  label={t('couponCode')}
                  value={couponCode}
                  onChange={(v: string) => {
                    setCouponCode(v);
                    setAppliedCoupon(null);
                  }}
                  name="couponCode"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={busy || !couponCode.trim() || !previewPlanId}
                onClick={() => applyCoupon(previewPlanId)}
                className="mb-4"
              >
                {t('applyCoupon')}
              </Button>
            </div>
            {assignedCoupons.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {t('assignedCoupons')}: {assignedCoupons.map((c) => c.code).join(', ')}
              </p>
            )}
            {appliedCoupon?.valid && (
              <p className="text-sm text-green-500 mt-2">
                {appliedCoupon.message} ({appliedCoupon.originalAmount?.toLocaleString()} → {appliedCoupon.finalAmount?.toLocaleString()} XAF)
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {paidPlans.map((p) => {
              const mult = period === 'yearly' ? 12 : period === 'quarterly' ? 3 : 1;
              const total = (p.monthlyPriceXaf || 0) * mult;
              const showDiscount =
                appliedCoupon?.valid &&
                appliedCoupon.planId === p.id &&
                appliedCoupon.finalAmount != null &&
                couponCode.trim();
              return (
                <div key={p.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex flex-col">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-2xl font-bold mt-2">
                    {showDiscount ? (
                      <>
                        <span className="text-base line-through text-gray-500 mr-2">{total.toLocaleString()}</span>
                        {Number(appliedCoupon.finalAmount).toLocaleString()}
                      </>
                    ) : (
                      total.toLocaleString()
                    )}{' '}
                    <span className="text-sm font-normal">XAF</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {p.maxUsers == null ? t('unlimitedUsers') : `${p.maxUsers} ${t('userManagement')}`}
                    {' · '}
                    {p.maxLocations == null ? t('unlimitedLocations') : `${p.maxLocations} ${t('allLocations')}`}
                  </p>
                  <Button
                    className="mt-auto pt-4 w-full"
                    disabled={busy || !canCheckout}
                    onClick={() => checkout(p.id)}
                  >
                    {t('subscribe')}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
