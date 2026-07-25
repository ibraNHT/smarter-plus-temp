import React, { useMemo } from 'react';
import { DollarSign, Coins, Warehouse, TrendingUp, AlertTriangle } from 'lucide-react';
import { useData } from '../hooks/useAppData';
import { formatCurrency, isInventoryLossReason } from '../constants';
import { Card, Spinner } from '../components/UI';
import type { InventoryEvent, InventoryItem } from '../types';

export default function Dashboard({ t, currency, locationId }: any) {
  const { data: income = [], loading: l1 } = useData('income', locationId);
  const { data: expenses = [], loading: l2 } = useData('expenses', locationId);
  const { data: inventory = [], loading: l3 } = useData('inventory', locationId);
  const { data: events = [], loading: l4 } = useData('inventory_events', locationId);

  const totalIncome = useMemo(() => income.reduce((acc: number, curr: any) => acc + curr.amount, 0), [income]);
  const totalExpenses = useMemo(() => expenses.reduce((acc: number, curr: any) => acc + curr.amount, 0), [expenses]);
  const inventoryVal = useMemo(
    () => inventory.reduce((acc: number, curr: InventoryItem) => acc + (curr.value * curr.quantity), 0),
    [inventory]
  );
  const net = totalIncome - totalExpenses;

  const inventoryHealth = useMemo(() => {
    const list: InventoryItem[] = Array.isArray(inventory) ? inventory : [];
    const ev: InventoryEvent[] = Array.isArray(events) ? events : [];
    const unitsLost = ev
      .filter((e) => isInventoryLossReason(e.reason))
      .reduce((a, e) => a + (Number(e.quantity) || 0), 0);
    const lossValue = ev
      .filter((e) => isInventoryLossReason(e.reason))
      .reduce((a, e) => {
        const item = list.find((i) => i.id === e.inventoryId);
        const unit = (e as any).unitValue ?? item?.value ?? 0;
        return a + unit * (Number(e.quantity) || 0);
      }, 0);
    return { unitsLost, lossValue, availableValue: inventoryVal };
  }, [inventory, events, inventoryVal]);

  if (l1 || l2 || l3 || l4) return <Spinner />;

  const Stat = ({ label, val, icon: Icon, color }: any) => (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{val}</p>
      </div>
      <div className={`p-3 rounded-full bg-opacity-20 ${color}`}>
        <Icon className="w-6 h-6 text-gray-900 dark:text-white" />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('dashboard')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Stat label={t('totalIncome')} val={formatCurrency(totalIncome, currency)} icon={DollarSign} color="bg-green-500" />
        <Stat label={t('totalExpenses')} val={formatCurrency(totalExpenses, currency)} icon={Coins} color="bg-red-500" />
        <Stat label={t('netBalance')} val={formatCurrency(net, currency)} icon={TrendingUp} color="bg-blue-500" />
        <Stat label={t('inventoryValue')} val={formatCurrency(inventoryVal, currency)} icon={Warehouse} color="bg-yellow-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t('inventoryHealth')}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-orange-500 bg-opacity-20">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('inventoryAvailableValue')}</span>
                <span className="font-semibold text-green-400">{formatCurrency(inventoryHealth.availableValue, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('inventoryLossValue')}</span>
                <span className="font-semibold text-red-400">{formatCurrency(inventoryHealth.lossValue, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('inventoryUnitsLost')}</span>
                <span className="font-semibold text-orange-400">{inventoryHealth.unitsLost}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title={t('recentActivity')}>
          <div className="space-y-4">
            {[...income, ...expenses]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((item: any) => (
                <div key={item.id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0">
                   <div>
                     <p className="font-medium">{item.source || item.description}</p>
                     <p className="text-xs text-gray-600 dark:text-gray-400">{item.date}</p>
                   </div>
                   <span className={item.source ? 'text-green-400' : 'text-red-400'}>
                     {item.source ? '+' : '-'} {formatCurrency(item.amount, currency)}
                   </span>
                </div>
              ))}
             {[...income, ...expenses].length === 0 && <p className="text-gray-500 dark:text-gray-500 text-sm">No activity yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
