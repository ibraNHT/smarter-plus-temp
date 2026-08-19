import React, { useMemo, useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { useData, useSubmit } from '../hooks/useAppData';
import { Card, Input, Button, Select, SuggestInput } from '../components/UI';
import { getTranslated, isDateWithinLimit, isLockedAfter24Hours } from '../constants';
import { useCurrency } from '../context/CurrencyContext';
import { Trash2 } from 'lucide-react';

export default function Expenses({ t, locationId, user, lang }: any) {
    const { data: expenses, loading } = useData('expenses', locationId);
    const { data: categories } = useData('expense_categories');
    const { data: expenseDescriptions = [] } = useData('expense_descriptions');
    const { add, remove, submitting } = useSubmit('expenses');
    const { formatMoney, bookCurrencyFor, workingCurrency } = useCurrency();
    
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [catId, setCatId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const descriptionOptions = useMemo(
        () =>
            (expenseDescriptions || []).map((d: any) => {
                const label = getTranslated(d, lang);
                return { value: label, label };
            }),
        [expenseDescriptions, lang]
    );

   // Implement handleRemove in a modal view for confirmation before deletion to prevent accidental loss of data
    const [removeModal, setRemoveModal] = useState<boolean>(false);
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
    const { showNotification } = useNotification();

    const hasPermissionFor = (action: string) => {
        const permissionMap: Record<string, string> = {
            'view': 'perm_viewExpenses',
            'add': 'perm_addExpenses',
            'delete': 'perm_deleteExpenses',
        };
        return user?.role?.permissions.includes(permissionMap[action]);
    };

        const openRemoveModal = (id: string, item: any) => {
        if (isLockedAfter24Hours(item?.createdAt)) {
            showNotification(t('locked24hMessage'), 'error');
            return;
        }
        setSelectedExpenseId(id);
        setRemoveModal(true);
    }

    const handleRemove = async () => {
        if (!selectedExpenseId) { 
            alert(t('errorNoExpense'));
            return;
            } // Guard clause

        console.log(`Attempting to remove expense with ID: ${selectedExpenseId}`);
        
        // Some APIs need the parent ID (locationId) to find the record
        if (hasPermissionFor('delete')) {
            const result = await remove(selectedExpenseId); 

            if (result) {
                showNotification('Expense removed successfully', 'success');
            } else {
                showNotification('Failed to remove expense', 'error');
            }
        } else showNotification('You do not have permission to delete expenses.     Please contact your administrator', 'error');

        // Always clean up state
        setRemoveModal(false);
        setSelectedExpenseId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!locationId || locationId === 'all') return alert(t('errorNoLocation'));
        
        if (!isDateWithinLimit(date)) {
            return alert(t('errorDatePast'));
        }
        
        if (hasPermissionFor('add')) {

            await add({
                description: desc,
                amount: parseFloat(amount),
                categoryId: catId,
                date: new Date(date).toISOString(),
                locationId,
                userId: user.id
            });
        } else {
            showNotification('You do not have permission to add expenses.   Please contact your administrator', 'error');
        }
        setDesc(''); setAmount(''); setCatId('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card title={t('addExpense')}>
                    <form onSubmit={handleSubmit}>
                        <SuggestInput label={t('description')} value={desc} onChange={setDesc} options={descriptionOptions} listId="expense-description-list" required />
                        <Select 
                            label={t('category')} 
                            value={catId} 
                            onChange={setCatId} 
                            required 
                            options={[
                                { value:'', label: '...', disabled: true },
                                ...categories.map((c: any) => ({ value: c.id, label: getTranslated(c, lang) }))
                            ]}
                        />
                        <Input label={`${t('amount')} (${workingCurrency})`} type="number" value={amount} onChange={setAmount} required />
                        <Input label={t('date')} type="date" value={date} onChange={setDate} required />
                        <Button type="submit" disabled={submitting} className="w-full">{t('add')}</Button>
                    </form>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card title={t('expenses')}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="pb-2">{t('date')}</th>
                                    <th className="pb-2">{t('description')}</th>
                                    <th className="pb-2">{t('category')}</th>
                                    <th className="pb-2 text-right">{t('amount')}</th>
                                    <th className="pb-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <tr><td colSpan={5}>...</td></tr> : expenses.map((item: any) => {
                                    const cat = categories.find((c:any) => c.id === item.categoryId);
                                    return (
                                    <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="py-3">{item.date}</td>
                                        <td className="py-3">{item.description}</td>
                                        <td className="py-3">{getTranslated(cat, lang)}</td>
                                        <td className="py-3 text-right text-red-400">{formatMoney(item.amount, bookCurrencyFor(item))}</td>
                                        <td className="py-3 text-right">
                                            <button
                                            onClick={() => openRemoveModal(item.id, item)}
                                            className={isLockedAfter24Hours(item.createdAt) ? 'text-gray-600 cursor-not-allowed opacity-50' : 'text-gray-500 dark:text-gray-500 hover:text-red-500'}
                                            title={isLockedAfter24Hours(item.createdAt) ? t('locked24hMessage') : t('delete')}
                                            disabled={isLockedAfter24Hours(item.createdAt)}
                                        ><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            {/* Remove Confirmation Modal */}
                {removeModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('Expense delete confirmation')}</h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-6">{t('Are you sure you want to delete this expense?')}</p>
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