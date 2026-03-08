import React, { useState } from 'react';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, CreditCard, Smartphone, Building, MinusCircle, Clock, CheckCircle, XCircle, ArrowLeft, TrendingUp } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { TransactionType, UserRole, WithdrawalStatus, PaymentMethod } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { OtpVerificationModal } from '../../components/OtpVerificationModal';

export const WalletDashboard: React.FC = () => {
  const { user, getWallet, fundWallet, requestWithdrawal, requestOtp, verifyOtp, producers, withdrawalRequests } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState<number | string>('');
  const [txnId, setTxnId] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'ORANGE' | 'MTN' | 'BANK'>('ORANGE');
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState<string>('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingWithdraw, setPendingWithdraw] = useState<{ amount: number; method: PaymentMethod } | null>(null);

  if (!user) return <div className="p-8 text-center">Please login</div>;

  const wallet = getWallet(user.id);
  const isProducer = user.role === UserRole.PRODUCER;
  const currentProducer = isProducer ? producers.find(p => p.id === user.producerId) : null;

  // Calculate pending withdrawals
  const myRequests = withdrawalRequests.filter(r => r.userId === user.id).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  const pendingAmount = myRequests.filter(r => r.status === WithdrawalStatus.PENDING).reduce((acc, curr) => acc + curr.amount, 0);
  const availableBalance = wallet.balance - pendingAmount;

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await fundWallet(Number(amount), selectedProvider, txnId);
    setLoading(false);
    if (result.success) {
      setShowTopUp(false);
      setAmount('');
      setTxnId('');
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProducer || !currentProducer) {
      alert("Withdrawals are for producers only.");
      return;
    }
    if (!selectedSavedMethodId) {
      alert("Please select a payment method.");
      return;
    }
    const method = currentProducer.paymentMethods.find(pm => pm.id === selectedSavedMethodId);
    if (!method) return;
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount < 100) {
      alert("Enter a valid amount (min 100 XAF).");
      return;
    }
    setPendingWithdraw({ amount: withdrawAmount, method });
    setShowOtpModal(true);
  };

  const handleOtpVerifiedForWithdraw = async (token: string) => {
    if (!pendingWithdraw) return;
    setLoading(true);
    const result = await requestWithdrawal(pendingWithdraw.amount, pendingWithdraw.method, token);
    setLoading(false);
    setShowOtpModal(false);
    setPendingWithdraw(null);
    if (result.success) {
      setShowWithdraw(false);
      setAmount('');
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  const getIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
      case TransactionType.RECEIVED:
        return <ArrowDownLeft className="h-5 w-5 text-green-600" />;
      case TransactionType.PAYMENT:
      case TransactionType.WITHDRAWAL:
        return <ArrowUpRight className="h-5 w-5 text-red-500" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.PENDING: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      case WithdrawalStatus.APPROVED: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</span>;
      case WithdrawalStatus.PROCESSED: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Processed</span>;
      case WithdrawalStatus.REJECTED: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO title="Wallet Dashboard | AgriMarket" noindex={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="p-3 bg-primary-100 rounded-full">
              <WalletIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('wallet.title')}</h1>
              <p className="text-sm text-gray-500">{user.name}</p>
            </div>
          </div>
        </div>

        {/* Balance Card - light background so dark balance text is clearly visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden p-8 relative border border-gray-200">
            <p className="text-gray-600 text-base font-semibold mb-2 tracking-wide">{t('wallet.balance')}</p>
            <h2 className="text-5xl md:text-6xl font-bold mb-1 tabular-nums tracking-tight text-gray-900">
              {wallet.balance.toLocaleString()} <span className="text-2xl md:text-3xl font-bold text-gray-800 ml-1">XAF</span>
            </h2>

            {/* Available Balance Display */}
            <div className="mt-5 pt-5 border-t border-gray-200">
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">{t('wallet.available')}</p>
              <p className="text-2xl font-bold mt-1 tabular-nums text-gray-900">{availableBalance.toLocaleString()} XAF</p>
              {pendingAmount > 0 && (
                <p className="text-sm text-amber-700 mt-1 font-medium">({pendingAmount.toLocaleString()} XAF Pending Withdrawals)</p>
              )}
            </div>

            <div className="absolute top-8 right-8 flex space-x-3">
              <button onClick={() => setShowTopUp(true)} className="p-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors">
                <Plus className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-center space-y-4 border border-gray-100">
            <button
              onClick={() => setShowTopUp(true)}
              className="w-full flex items-center justify-center bg-primary-50 text-primary-700 px-4 py-3 rounded-lg font-bold hover:bg-primary-100 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              {t('wallet.topup')}
            </button>

            {/* Withdraw Button - Only for Producers */}
            {isProducer && (
              <button
                onClick={() => setShowWithdraw(true)}
                className="w-full flex items-center justify-center bg-gray-900 text-white px-4 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                disabled={availableBalance <= 0}
              >
                <MinusCircle className="h-5 w-5 mr-2" />
                {t('wallet.withdraw')}
              </button>
            )}
          </div>
        </div>

        {/* Producer Withdrawal History */}
        {isProducer && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">{t('wallet.requests')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('wallet.date')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('wallet.amount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dash.status')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myRequests.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500 text-sm">{t('wallet.noReq')}</td></tr>
                  ) : (
                    myRequests.map(req => (
                      <tr key={req.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.requestDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{req.amount.toLocaleString()} XAF</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.paymentMethod.provider} - {req.paymentMethod.accountNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(req.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{t('wallet.history')}</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {wallet.transactions.length === 0 ? (
              <li className="px-6 py-12 text-center text-gray-500">
                <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                {t('wallet.noTx')}
              </li>
            ) : (
              wallet.transactions.map((tx) => (
                <li key={tx.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {getIcon(tx.type)}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                        <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleString()} • {tx.reference || 'System'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.RECEIVED ? 'text-green-700' : 'text-gray-900'}`}>
                        {tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.RECEIVED ? '+' : '-'}
                        {tx.amount.toLocaleString()} XAF
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{tx.type.toLowerCase()}</p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Top Up Modal */}
        {showTopUp && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowTopUp(false)}></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{t('wallet.topup')}</h3>
                <form onSubmit={handleTopUp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('wallet.selectMethod')}</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div onClick={() => setSelectedProvider('ORANGE')} className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center text-center ${selectedProvider === 'ORANGE' ? 'border-orange-500 bg-orange-50' : ''}`}><Smartphone className="h-6 w-6 text-orange-500 mb-2" /><span className="text-xs text-gray-900">Orange</span></div>
                      <div onClick={() => setSelectedProvider('MTN')} className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center text-center ${selectedProvider === 'MTN' ? 'border-yellow-400 bg-yellow-50' : ''}`}><Smartphone className="h-6 w-6 text-yellow-400 mb-2" /><span className="text-xs text-gray-900">MTN</span></div>
                      <div onClick={() => setSelectedProvider('BANK')} className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center text-center ${selectedProvider === 'BANK' ? 'border-blue-500 bg-blue-50' : ''}`}><Building className="h-6 w-6 text-blue-500 mb-2" /><span className="text-xs text-gray-900">Bank</span></div>
                    </div>
                  </div>
                  <input type="number" required min="100" className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" />
                  <input type="text" required className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500" value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="Transaction ID" />
                  <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">{loading ? 'Processing...' : 'Fund Wallet'}</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {showWithdraw && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowWithdraw(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">{t('wallet.requestWithdraw')}</h3>
                  <p className="text-sm text-gray-500 mt-2 mb-4">{t('wallet.withdrawDesc')}</p>

                  {isProducer && (!currentProducer?.paymentMethods || currentProducer.paymentMethods.length === 0) ? (
                    <div className="text-center py-4">
                      <p className="text-red-600 text-sm mb-4">You have no saved payment methods.</p>
                      <Link to="/producer/profile" className="text-primary-600 hover:underline text-sm font-bold">Go to Profile to Add Payment Method</Link>
                    </div>
                  ) : (
                    <form onSubmit={handleWithdrawRequest} className="mt-4 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('wallet.selectSaved')}</label>
                        <div className="space-y-2">
                          {currentProducer?.paymentMethods.map(pm => (
                            <label key={pm.id} className={`flex items-center p-3 border rounded-lg cursor-pointer ${selectedSavedMethodId === pm.id ? 'ring-2 ring-primary-500 border-transparent bg-primary-50' : 'hover:bg-gray-50'}`}>
                              <input
                                type="radio"
                                name="paymentMethod"
                                value={pm.id}
                                checked={selectedSavedMethodId === pm.id}
                                onChange={() => setSelectedSavedMethodId(pm.id)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex justify-between">
                                  <span className="block text-sm font-medium text-gray-900">{pm.provider}</span>
                                  <span className="block text-xs text-gray-500">{pm.accountNumber}</span>
                                </div>
                                <span className="block text-xs text-gray-500">{pm.accountName}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('wallet.enterAmount')}</label>
                        <div className="relative rounded-md shadow-sm">
                          <input
                            type="number"
                            required min="100" max={availableBalance}
                            className="block w-full pr-12 border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 p-2 border bg-white text-gray-900"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">XAF</span>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Max available: {availableBalance.toLocaleString()} XAF</p>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button type="submit" disabled={loading || !selectedSavedMethodId} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                          {loading ? t('wallet.processing') : t('wallet.processWithdraw')}
                        </button>
                        <button type="button" onClick={() => setShowWithdraw(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm">
                          {t('form.cancel')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <OtpVerificationModal
          open={showOtpModal}
          onClose={() => { setShowOtpModal(false); setPendingWithdraw(null); }}
          action="WITHDRAWAL"
          onRequestOtp={requestOtp}
          onVerifyOtp={verifyOtp}
          onVerified={handleOtpVerifiedForWithdraw}
          title={t('otp.verifyWithdrawTitle')}
          sendCodeLabel={t('otp.sendCode')}
          verifyLabel={t('otp.verify')}
          codeSentMessage={t('otp.enterCode')}
        />
      </div>
    </div>
  );
};
