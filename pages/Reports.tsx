import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useData, apiFetch } from '../hooks/useAppData';
import { Card, Button, Select } from '../components/UI';
import { getTranslated, isInventoryLossReason } from '../constants';
import { useCurrency } from '../context/CurrencyContext';
import { FileDown, FileSpreadsheet, TrendingUp, TrendingDown, Wallet, Package, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer,
  BarChart,
  PieChart,
  LineChart,
  Bar,
  Line,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const INCOME_COLOR = '#10b981';
const EXPENSE_COLOR = '#ef4444';

const formatCompactAmount = (value: number | string) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? '');
  const sign = number < 0 ? '-' : '';
  const abs = Math.abs(number);
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${sign}${abs}`;
};

export default function Reports({ t, locationId, lang }: any) {
  const { formatMoney, toDisplay, bookCurrencyFor, displayCurrency } = useCurrency();
  const { data: income = [] } = useData('income', locationId);
  const { data: expenses = [] } = useData('expenses', locationId);
  const { data: inventory = [] } = useData('inventory', locationId);
  const { data: inventoryEvents = [] } = useData('inventory_events', locationId);
  const { data: locations = [] } = useData('locations');
  const { data: categories = [] } = useData('expense_categories');
  const { data: inventoryTypes = [] } = useData('inventory_types');

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

  const [targetLocationId, setTargetLocationId] = useState(locationId || 'all');
  const [dateFrom, setDateFrom] = useState(firstDayOfYear.toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(now.toISOString().slice(0, 10));
  const [preset, setPreset] = useState('');
  const [timeframe, setTimeframe] = useState('monthly');
  const [metric, setMetric] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [reportData, setReportData] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    setTargetLocationId(locationId || 'all');
  }, [locationId]);

  useEffect(() => {
    if (preset === 'last7') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      setDateFrom(d.toISOString().slice(0, 10));
      setDateTo(new Date().toISOString().slice(0, 10));
    } else if (preset === 'month') {
      setDateFrom(firstDayOfMonth.toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    } else if (preset === 'year') {
      setDateFrom(firstDayOfYear.toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    } else if (preset === 'last12') {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      d.setMonth(d.getMonth());
      d.setDate(d.getDate() + 1);
      setDateFrom(d.toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    }
  }, [preset]);

  const filterByLocation = useCallback((arr: any[]) => {
    if (!arr?.length) return [];
    if (targetLocationId === 'all') return arr;
    return arr.filter((i: any) => i.locationId === targetLocationId);
  }, [targetLocationId]);

  const inDateRange = useCallback((dateStr: string) => {
    const d = new Date(dateStr);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    return d >= from && d <= to;
  }, [dateFrom, dateTo]);

  const inDisplay = useCallback(
    (item: any, amount?: number) => toDisplay(amount ?? item.amount, bookCurrencyFor(item)),
    [toDisplay, bookCurrencyFor]
  );

  const filteredIncome = useMemo(
    () => filterByLocation(income).filter((i: any) => inDateRange(i.date)).map((i: any) => ({ ...i, amount: inDisplay(i) })),
    [income, filterByLocation, inDateRange, inDisplay]
  );
  const filteredExpenses = useMemo(
    () => filterByLocation(expenses).filter((e: any) => inDateRange(e.date)).map((e: any) => ({ ...e, amount: inDisplay(e) })),
    [expenses, filterByLocation, inDateRange, inDisplay]
  );
  const filteredInventory = useMemo(
    () => filterByLocation(inventory).map((i: any) => ({
      ...i,
      value: toDisplay(i.value ?? 0, bookCurrencyFor(i)),
    })),
    [inventory, filterByLocation, toDisplay, bookCurrencyFor]
  );
  const filteredEvents = useMemo(
    () => filterByLocation(inventoryEvents).filter((e: any) => inDateRange(e.createdAt || e.date)),
    [inventoryEvents, filterByLocation, inDateRange]
  );

  const totalIncome = useMemo(() => filteredIncome.reduce((a: number, i: any) => a + i.amount, 0), [filteredIncome]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((a: number, e: any) => a + e.amount, 0), [filteredExpenses]);
  const netBalance = totalIncome - totalExpenses;
  const inventoryValue = useMemo(() => filteredInventory.reduce((a: number, i: any) => a + (i.value ?? 0) * (i.quantity ?? 0), 0), [filteredInventory]);

  const inventoryLossStats = useMemo(() => {
    const losses = filteredEvents.filter((e: any) => isInventoryLossReason(e.reason));
    const byReason: Record<string, { units: number; value: number }> = {
      damaged: { units: 0, value: 0 },
      expired: { units: 0, value: 0 },
      stolen: { units: 0, value: 0 },
    };
    let lossValue = 0;
    const locInv = filterByLocation(inventory);
    losses.forEach((e: any) => {
      const item = locInv.find((i: any) => i.id === e.inventoryId);
      const unit = e.unitValue ?? item?.value ?? 0;
      const qty = Number(e.quantity) || 0;
      const val = toDisplay(unit * qty, bookCurrencyFor(item || e));
      lossValue += val;
      if (byReason[e.reason]) {
        byReason[e.reason].units += qty;
        byReason[e.reason].value += val;
      }
    });
    return { lossValue, byReason, losses };
  }, [filteredEvents, inventory, filterByLocation, toDisplay, bookCurrencyFor]);

  const lossesByReasonData = useMemo(() => {
    return (['damaged', 'expired', 'stolen'] as const)
      .map((reason) => ({
        name: t(`inventoryReason_${reason}`),
        value: inventoryLossStats.byReason[reason].value,
        units: inventoryLossStats.byReason[reason].units,
        reason,
      }))
      .filter((r) => r.value > 0 || r.units > 0);
  }, [inventoryLossStats, t]);

  const monthlySeries = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const map: Record<string, { income: number; expense: number; month: string }> = {};
    const m = new Date(from);
    while (m <= to) {
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { income: 0, expense: 0, month: m.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: '2-digit' }) };
      m.setMonth(m.getMonth() + 1);
    }
    filteredIncome.forEach((i: any) => {
      const d = new Date(i.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (map[key]) map[key].income += i.amount;
    });
    filteredExpenses.forEach((e: any) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (map[key]) map[key].expense += e.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ ...v, net: v.income - v.expense }));
  }, [filteredIncome, filteredExpenses, dateFrom, dateTo, lang]);

  const incomeBySourceData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredIncome.forEach((i: any) => {
      const name = i.source || t('income');
      map[name] = (map[name] || 0) + i.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredIncome, t]);

  const expensesByCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e: any) => {
      const cat = categories.find((c: any) => c.id === e.categoryId);
      const name = cat ? getTranslated(cat, lang) : (e.categoryId || t('category'));
      map[name] = (map[name] || 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses, categories, lang, t]);

  const generate = () => {
    let baseIncome = filterByLocation(income);
    let baseExpenses = filterByLocation(expenses);
    if (timeframe !== 'all_time') {
      baseIncome = baseIncome.filter((i: any) => {
        const d = new Date(i.date);
        const matchYear = d.getFullYear() === Number(selectedYear);
        if (timeframe === 'yearly') return matchYear;
        return matchYear && d.getMonth() === Number(selectedMonth);
      });
      baseExpenses = baseExpenses.filter((e: any) => {
        const d = new Date(e.date);
        const matchYear = d.getFullYear() === Number(selectedYear);
        if (timeframe === 'yearly') return matchYear;
        return matchYear && d.getMonth() === Number(selectedMonth);
      });
    }
    const totalInc = baseIncome.reduce((a: number, b: any) => a + inDisplay(b), 0);
    const totalExp = baseExpenses.reduce((a: number, b: any) => a + inDisplay(b), 0);
    setForecast({
      income: totalInc / 12,
      expense: totalExp / 12,
      net: (totalInc - totalExp) / 12,
      locationName: targetLocationId === 'all' ? t('allLocations') : getTranslated(locations.find((l: any) => l.id === targetLocationId), lang),
    });
    let data = [
      ...baseIncome.map((i: any) => ({ ...i, type: 'income', amount: inDisplay(i) })),
      ...baseExpenses.map((e: any) => ({ ...e, type: 'expense', amount: inDisplay(e) })),
    ];
    if (metric === 'income') data = data.filter((d: any) => d.type === 'income');
    else if (metric === 'expenses') data = data.filter((d: any) => d.type === 'expense');
    else if (metric === 'inventory') {
      data = inventoryLossStats.losses.map((e: any) => {
        const item = inventory.find((i: any) => i.id === e.inventoryId);
        const unit = e.unitValue ?? item?.value ?? 0;
        return {
          date: (e.createdAt || e.date || '').slice(0, 10),
          type: 'inventory',
          description: `${t(`inventoryReason_${e.reason}`)} — ${item?.name || e.inventoryId} × ${e.quantity}`,
          source: t(`inventoryReason_${e.reason}`),
          amount: toDisplay(unit * (Number(e.quantity) || 0), bookCurrencyFor(item || e)),
          locationId: e.locationId,
        };
      });
    }
    data.sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));
    setReportData(data);
  };

  const downloadCSV = () => {
    const headers = ['Date', 'Type', 'Description/Source', 'Amount', 'Location'];
    const rows = reportData.map((row: any) => [
      row.date,
      row.type?.toUpperCase?.() || '',
      `"${row.source || row.description || ''}"`,
      row.amount,
      row.locationId,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n' + rows.map((e: any[]) => e.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `report_${dateFrom}_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const locName = targetLocationId === 'all' ? t('allLocations') : getTranslated(locations.find((l: any) => l.id === targetLocationId), lang);

    // Sheet 1: Summary
    const summaryData = [
      [t('financialOverview')],
      [t('dateRange'), `${dateFrom} — ${dateTo}`],
      [t('specificLocation'), locName],
      [],
      [t('totalIncome'), totalIncome],
      [t('totalExpenses'), totalExpenses],
      [t('netBalance'), netBalance],
      [t('inventoryValue'), inventoryValue],
      [t('inventoryLossValue'), inventoryLossStats.lossValue],
      [t('inventoryDamagedUnits'), inventoryLossStats.byReason.damaged.units],
      [t('inventoryExpiredUnits'), inventoryLossStats.byReason.expired.units],
      [t('inventoryStolenUnits'), inventoryLossStats.byReason.stolen.units],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet 2: Income vs Expenses by month
    const monthlyRows = monthlySeries.map((r: any) => ({
      [t('date')]: r.month,
      [t('income')]: r.income,
      [t('expenses')]: r.expense,
      [t('netBalance')]: r.net,
    }));
    if (monthlyRows.length > 0) {
      const wsMonthly = XLSX.utils.json_to_sheet(monthlyRows);
      XLSX.utils.book_append_sheet(wb, wsMonthly, t('incomeVsExpenses').slice(0, 31));
    }

    // Sheet 3: Income by source
    const incomeSourceRows = incomeBySourceData.map((r: any) => ({ [t('source')]: r.name, [t('amount')]: r.value }));
    if (incomeSourceRows.length > 0) {
      const wsIncome = XLSX.utils.json_to_sheet(incomeSourceRows);
      XLSX.utils.book_append_sheet(wb, wsIncome, t('incomeBySource').slice(0, 31));
    }

    // Sheet 4: Expenses by category
    const expenseCatRows = expensesByCategoryData.map((r: any) => ({ [t('category')]: r.name, [t('amount')]: r.value }));
    if (expenseCatRows.length > 0) {
      const wsExpense = XLSX.utils.json_to_sheet(expenseCatRows);
      XLSX.utils.book_append_sheet(wb, wsExpense, t('expensesByCategory').slice(0, 31));
    }

    // Sheet 5: Inventory losses
    const lossRows = inventoryLossStats.losses.map((e: any) => {
      const item = filteredInventory.find((i: any) => i.id === e.inventoryId);
      const type = inventoryTypes.find((ty: any) => ty.id === item?.typeId);
      const unit = e.unitValue ?? item?.value ?? 0;
      return {
        [t('date')]: (e.createdAt || e.date || '').slice(0, 10),
        [t('item')]: item?.name || e.inventoryId,
        [t('type')]: type ? getTranslated(type, lang) : '',
        [t('inventoryIncidentReason')]: t(`inventoryReason_${e.reason}`),
        [t('quantity')]: e.quantity,
        [t('amount')]: unit * (Number(e.quantity) || 0),
        [t('inventoryIncidentNote')]: e.note || '',
      };
    });
    if (lossRows.length > 0) {
      const wsLoss = XLSX.utils.json_to_sheet(lossRows);
      XLSX.utils.book_append_sheet(wb, wsLoss, t('inventoryLossesSheet').slice(0, 31));
    }

    // Sheet 6: Transactions (all in date range)
    const transactions = [
      ...filteredIncome.map((i: any) => ({ Date: i.date, Type: 'INCOME', 'Description/Source': i.source || '', Amount: i.amount, Location: i.locationId })),
      ...filteredExpenses.map((e: any) => ({ Date: e.date, Type: 'EXPENSE', 'Description/Source': e.description || '', Amount: e.amount, Location: e.locationId })),
    ].sort((a: any, b: any) => (a.Date || '').localeCompare(b.Date || ''));
    if (transactions.length > 0) {
      const wsTx = XLSX.utils.json_to_sheet(transactions);
      XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');
    }

    XLSX.writeFile(wb, `report_${dateFrom}_${dateTo}.xlsx`);
    apiFetch('/notifications/log', {
      method: 'POST',
      body: JSON.stringify({ locationId: targetLocationId || 'all', type: 'report_downloaded', title: t('reportDownloaded') }),
    }).catch(() => {});
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl px-3 py-2 text-sm">
        {label && <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{label}</p>}
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? formatMoney(p.value, displayCurrency) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports')}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowCharts(!showCharts)} className="text-sm">
            {showCharts ? t('hideCharts') : t('showCharts')}
          </Button>
          <Button variant="outline" onClick={downloadExcel} className="text-sm px-3 py-1"><FileSpreadsheet className="w-4 h-4 mr-2 inline" /> {t('downloadExcel')}</Button>
          {reportData.length > 0 && (
            <>
              <Button variant="outline" onClick={downloadCSV} className="text-sm px-3 py-1"><FileDown className="w-4 h-4 mr-2 inline" /> CSV</Button>
              <Button variant="secondary" onClick={() => window.print()} className="text-sm px-3 py-1">{t('download')} (PDF)</Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="no-print p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          {locationId === 'all' ? (
            <Select
              label={t('specificLocation')}
              value={targetLocationId}
              onChange={(v: string) => setTargetLocationId(v)}
              options={[
                { value: 'all', label: t('allLocations') },
                ...locations.map((l: any) => ({ value: l.id, label: getTranslated(l, lang) })),
              ]}
            />
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('specificLocation')}</label>
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-400 text-sm border border-gray-300 dark:border-gray-600">
                {getTranslated(locations.find((l: any) => l.id === locationId), lang)}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('dateRange')}</label>
            <Select
              value={preset}
              onChange={(v: string) => setPreset(v)}
              options={[
                { value: '', label: `— ${t('dateRange')} —` },
                { value: 'last7', label: t('last7Days') },
                { value: 'month', label: t('thisMonth') },
                { value: 'year', label: t('thisYear') },
                { value: 'last12', label: t('last12Months') },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('dateFrom')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('dateTo')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 no-print">
        <Card className="p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" /> {t('totalIncome')}
          </div>
          <p className="text-xl font-bold text-green-400">{formatMoney(totalIncome, displayCurrency)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{filteredIncome.length} {t('income').toLowerCase()}</p>
        </Card>
        <Card className="p-4 border-l-4 border-red-500">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <TrendingDown className="w-4 h-4" /> {t('totalExpenses')}
          </div>
          <p className="text-xl font-bold text-red-400">{formatMoney(totalExpenses, displayCurrency)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{filteredExpenses.length} {t('expenses').toLowerCase()}</p>
        </Card>
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <Wallet className="w-4 h-4" /> {t('netBalance')}
          </div>
          <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
            {formatMoney(netBalance, displayCurrency)}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-purple-500">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <Package className="w-4 h-4" /> {t('inventoryAvailableValue')}
          </div>
          <p className="text-xl font-bold text-purple-400">{formatMoney(inventoryValue, displayCurrency)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{filteredInventory.length} items</p>
        </Card>
        <Card className="p-4 border-l-4 border-orange-500">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <AlertTriangle className="w-4 h-4" /> {t('inventoryLossValue')}
          </div>
          <p className="text-xl font-bold text-orange-400">{formatMoney(inventoryLossStats.lossValue, displayCurrency)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {t('inventoryDamagedUnits')} {inventoryLossStats.byReason.damaged.units} · {t('inventoryExpiredUnits')} {inventoryLossStats.byReason.expired.units} · {t('inventoryStolenUnits')} {inventoryLossStats.byReason.stolen.units}
          </p>
        </Card>
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="space-y-6 no-print">
          {monthlySeries.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('incomeVsExpenses')}</h3>
              <div className="w-full" style={{ minHeight: 320 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlySeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} tickFormatter={formatCompactAmount} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="income" name={t('income')} fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name={t('expenses')} fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {incomeBySourceData.length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('incomeBySource')}</h3>
                <div className="w-full" style={{ minHeight: 288 }}>
                  <ResponsiveContainer width="100%" height={288}>
                    <PieChart>
                      <Pie
                        data={incomeBySourceData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {incomeBySourceData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatMoney(v, displayCurrency)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
            {expensesByCategoryData.length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('expensesByCategory')}</h3>
                <div className="w-full" style={{ minHeight: 288 }}>
                  <ResponsiveContainer width="100%" height={288}>
                    <PieChart>
                      <Pie
                        data={expensesByCategoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expensesByCategoryData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatMoney(v, displayCurrency)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>

          {lossesByReasonData.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('inventoryLossesByReason')}</h3>
              <div className="w-full" style={{ minHeight: 288 }}>
                <ResponsiveContainer width="100%" height={288}>
                  <BarChart data={lossesByReasonData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} tickFormatter={formatCompactAmount} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name={t('inventoryLossValue')} fill="#f59e0b" radius={[4, 4, 0, 0]}>
                      {lossesByReasonData.map((entry) => (
                        <Cell
                          key={entry.reason}
                          fill={entry.reason === 'stolen' ? '#ef4444' : entry.reason === 'damaged' ? '#f97316' : '#eab308'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {monthlySeries.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('netTrend')}</h3>
              <div className="w-full" style={{ minHeight: 288 }}>
                <ResponsiveContainer width="100%" height={288}>
                  <LineChart data={monthlySeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} tickFormatter={formatCompactAmount} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="net" name={t('netBalance')} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Table report + forecast (existing flow) */}
      <Card className="no-print p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <Select
            label={t('metric')}
            value={metric}
            onChange={(v: string) => setMetric(v)}
            options={[
              { value: 'all', label: t('allMetrics') },
              { value: 'income', label: t('incomeOnly') },
              { value: 'expenses', label: t('expensesOnly') },
              { value: 'inventory', label: t('inventoryOnly') },
            ]}
          />
          <Select
            label={t('type')}
            value={timeframe}
            onChange={(v: string) => setTimeframe(v)}
            options={[
              { value: 'monthly', label: t('monthly') },
              { value: 'yearly', label: t('yearly') },
              { value: 'all_time', label: t('allTime') },
            ]}
          />
          <Select
            label={t('date')}
            value={String(selectedYear)}
            onChange={(v: string) => setSelectedYear(Number(v))}
            disabled={timeframe === 'all_time'}
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
          />
          {timeframe === 'monthly' && (
            <Select
              label={t('monthly')}
              value={String(selectedMonth)}
              onChange={(v: string) => setSelectedMonth(Number(v))}
              options={months.map((m, i) => ({ value: String(i), label: m }))}
            />
          )}
          <Button onClick={generate}>{t('generateReport')}</Button>
        </div>
      </Card>

      {reportData.length > 0 && (
        <Card className="print-only min-h-[400px] p-4">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Financial Report</h3>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {targetLocationId === 'all' ? t('allLocations') : getTranslated(locations.find((l: any) => l.id === targetLocationId), lang)} — {dateFrom} to {dateTo}
            </p>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-2">{t('date')}</th>
                <th className="py-2">{t('description')}/{t('source')}</th>
                <th className="py-2 text-right">{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-2">{item.date}</td>
                  <td className="py-2">{item.source || item.description}</td>
                  <td className={`py-2 text-right ${item.type === 'income' ? 'text-green-400' : item.type === 'inventory' ? 'text-orange-400' : 'text-red-400'}`}>
                    {item.type === 'income' ? '+' : '-'} {formatMoney(item.amount, displayCurrency)}
                  </td>
                </tr>
              ))}
              <tr className="font-bold border-t-2 border-gray-300 dark:border-gray-600">
                <td className="py-4" colSpan={2}>Total</td>
                <td className="py-4 text-right">
                  {formatMoney(
                    reportData.reduce((acc: number, curr: any) => acc + (curr.type === 'income' ? curr.amount : -curr.amount), 0),
                    displayCurrency
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      {forecast && (
        <Card className="no-print p-4 lg:max-w-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('forecastTitle')}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{forecast.locationName}</p>
          <div className="space-y-3">
            <div className="p-3 bg-gray-100/80 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Proj. Monthly Income</p>
              <p className="text-xl font-bold text-green-400">{formatMoney(forecast.income, displayCurrency)}</p>
            </div>
            <div className="p-3 bg-gray-100/80 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Proj. Monthly Expense</p>
              <p className="text-xl font-bold text-red-400">{formatMoney(forecast.expense, displayCurrency)}</p>
            </div>
            <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase">Proj. Net</p>
              <p className={`text-2xl font-bold ${forecast.net >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                {formatMoney(forecast.net, displayCurrency)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {!showCharts && reportData.length === 0 && filteredIncome.length === 0 && filteredExpenses.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          Select a date range above to see the financial overview and charts, or use the filters below to generate a detailed table report.
        </div>
      )}
    </div>
  );
}
