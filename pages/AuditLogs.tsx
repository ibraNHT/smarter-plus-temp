import React, { useState, useEffect, useCallback } from 'react';
import { useData, apiFetch } from '../hooks/useAppData';
import { Card, Button, Select } from '../components/UI';
import { getTranslated } from '../constants';

interface AuditLogEntry {
  id: string;
  userId: string;
  locationId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  createdAt: string;
  user?: { id: string; email: string; firstName: string; lastName: string };
  location?: { id: string; en: string; fr: string };
}

export default function AuditLogs({ t, lang, locationId: contextLocationId }: any) {
  const { data: locations } = useData('locations');
  const [locationId, setLocationId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      if (locationId?.trim()) params.set('locationId', locationId.trim());
      if (userId?.trim()) params.set('userId', userId.trim());
      if (dateFrom?.trim()) params.set('dateFrom', new Date(dateFrom).toISOString());
      if (dateTo?.trim()) params.set('dateTo', new Date(dateTo + 'T23:59:59.999Z').toISOString());
      const res = await apiFetch(`/audit-logs?${params.toString()}`);
      setLogs(res.data || []);
      setPagination(res.pagination || null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load audit logs');
      setLogs([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, locationId, userId, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleApplyFilters = () => {
    setPage(1);
  };

  const handleClearFilters = () => {
    setLocationId('');
    setUserId('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  useEffect(() => {
    if (contextLocationId && contextLocationId !== 'all' && !locationId) {
      setLocationId(contextLocationId);
    }
  }, [contextLocationId]);

  const locationOptions = locations || [];
  const locLabel = (loc: any) => getTranslated(loc, lang) || loc?.id || '';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auditLogs')}</h1>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('filterByLocation')}</label>
            <Select
              value={locationId}
              onChange={(val: string) => setLocationId(val)}
              options={[
                { value: '', label: `— ${t('allLocations')} —` },
                ...locationOptions.map((loc: any) => ({ value: loc.id, label: locLabel(loc) })),
              ]}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('filterByUser')}</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="w-full rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('date')} (from)</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('date')} (to)</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters}>{t('applyFilters')}</Button>
            <Button variant="secondary" onClick={handleClearFilters}>{t('clearFilters')}</Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-600 text-red-200 px-4 py-3">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">{t('noAuditLogs')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('auditTime')}</th>
                  <th className="px-4 py-3 font-medium">{t('auditUser')}</th>
                  <th className="px-4 py-3 font-medium">{t('auditAction')}</th>
                  <th className="px-4 py-3 font-medium">{t('auditResource')}</th>
                  <th className="px-4 py-3 font-medium">{t('auditLocation')}</th>
                  <th className="px-4 py-3 font-medium">{t('auditDetails')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US') : '—'}
                    </td>
                    <td className="px-4 py-2">
                      {log.user
                        ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email
                        : log.userId}
                    </td>
                    <td className="px-4 py-2">{log.action}</td>
                    <td className="px-4 py-2">{log.resource}</td>
                    <td className="px-4 py-2">
                      {log.location ? locLabel(log.location) : (log.locationId || '—')}
                    </td>
                    <td className="px-4 py-2 max-w-xs truncate" title={log.details || ''}>
                      {log.details || log.resourceId || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <Button
                disabled={pagination.page <= 1}
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                disabled={pagination.page >= pagination.totalPages}
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
