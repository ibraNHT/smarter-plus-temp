import React, { useMemo, useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { useData, useSubmit } from '../hooks/useAppData';
import { Card, Input, Button, SuggestInput } from '../components/UI';
import { formatCurrency, getTranslated, isDateWithinLimit, isLockedAfter24Hours } from '../constants';
import { Trash2 } from 'lucide-react';

export default function Income({ t, locationId, user, currency, lang }: any) {
  const { data: income, loading } = useData('income', locationId);
  const { data: incomeSources = [] } = useData('income_sources');
  const { add, remove, submitting } = useSubmit('income');
  
//   Add incomes according to this payload structure:
// {
//   "amount": 2500.00,
//   "date": "2026-02-23T12:00:00.000Z",
//   "source": "Client Payment", optional, can be null
//   "description": "Monthly consulting fee", optional, can be null
//   "categoryId": "cat_services", optional, can be null
//   "locationId": "douala_4286",
//   "userId": "user-uuid-here"
// }
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  // HTML type="date" requires yyyy-MM-dd; store that in state
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');

  const sourceOptions = useMemo(
    () =>
      (incomeSources || []).map((s: any) => {
        const label = getTranslated(s, lang);
        return { value: label, label };
      }),
    [incomeSources, lang]
  );

  // Implement handleRemove in a modal view for confirmation before deletion to prevent accidental loss of data
  const [removeModal, setRemoveModal] = useState<boolean>(false);
  const [selectedIncomeId, setSelectedIncomeId] = useState<string | null>(null);
  const { showNotification } = useNotification();

 const hasPermissionFor = (action: string) => {
    const permissionMap: Record<string, string> = {
        'view': 'perm_viewIncome',
        'add': 'perm_addIncome',
        'delete': 'perm_deleteIncome',
    };
    return user?.role?.permissions.includes(permissionMap[action]);
  };

  const openRemoveModal = (id: string, item: any) => {
    if (isLockedAfter24Hours(item?.createdAt)) {
      showNotification(t('locked24hMessage'), 'error');
      return;
    }
    setSelectedIncomeId(id);
    setRemoveModal(true);
  }

  const handleRemove = async () => {
    if (!selectedIncomeId) { 
        alert(t('errorNoIncome'));
        return;
        } // Guard clause

    // Some APIs need the parent ID (locationId) to find the record
    if (hasPermissionFor('delete')) {
        const result = await remove(selectedIncomeId); 

        if (result) {
            showNotification('Income removed successfully', 'success');
        } else {
            showNotification('Failed to remove income', 'error');
        }
    } else showNotification('You do not have permission to delete incomes.     Please contact your administrator', 'error');

    // Always clean up state
    setRemoveModal(false);
    setSelectedIncomeId(null);
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || locationId === 'all') return alert(t('errorNoLocation'));
    
    if (!isDateWithinLimit(date)) {
        return alert(t('errorDatePast'));
    }

    if (hasPermissionFor('add')) {
        const res = await add({
            amount: parseFloat(amount),
            date: new Date(date).toISOString(), // Ensure date is in correct format
            source,
            description,
            locationId,
            userId: user.id,
            });
        if (res) {
            showNotification('Income added successfully', 'success');
        } else {
            showNotification('Failed to add income', 'error');
        }
    } else {
        showNotification('You do not have permission to add incomes.      Please contact your administrator', 'error');
    }
    setSource(''); setAmount(''); setDate(new Date().toISOString().slice(0, 10)); setDescription('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <Card title={t('addIncome')}>
                <form onSubmit={handleSubmit}>
                    <SuggestInput label={t('source')} value={source} onChange={setSource} options={sourceOptions} listId="income-source-list" required />
                    <Input label={t('amount')} type="number" value={amount} onChange={setAmount} required />
                    <Input label={t('date')} type="date" value={date} onChange={setDate} required />
                    <Input label={t('description')} value={description} onChange={setDescription} />
                    <Button type="submit" disabled={submitting} className="w-full">{t('add')}</Button>
                </form>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card title={t('income')}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="pb-2">{t('date')}</th>
                                <th className="pb-2">{t('source')}</th>
                                <th className="pb-2 text-right">{t('amount')}</th>
                                <th className="pb-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={4}>...</td></tr> : income.map((item: any) => (
                                <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3">{item.date}</td>
                                    <td className="py-3">{item.source}</td>
                                    <td className="py-3 text-right text-green-400">{formatCurrency(item.amount, currency)}</td>
                                    <td className="py-3 text-right">
                                        <button
                                        onClick={() => openRemoveModal(item.id, item)}
                                        className={isLockedAfter24Hours(item.createdAt) ? 'text-gray-600 cursor-not-allowed opacity-50' : 'text-gray-500 dark:text-gray-500 hover:text-red-500'}
                                        title={isLockedAfter24Hours(item.createdAt) ? t('locked24hMessage') : t('delete')}
                                        disabled={isLockedAfter24Hours(item.createdAt)}
                                    ><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
        {/* Remove Confirmation Modal */}
        {removeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('Income delete confirmation')}</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">{t('Are you sure you want to delete this income?')}</p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="secondary" onClick={() => setRemoveModal(false)}>{t('cancel')}</Button>
                        <Button 
                            variant="danger" 
                            onClick={handleRemove} 
                            >
                                <Trash2 size={16} className="inline mr-1"/>
                                {t('delete')}
                        </Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}