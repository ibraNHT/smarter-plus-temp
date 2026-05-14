
import React, { useState, useEffect } from 'react';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { UserRole, WeeklySchedule, AvailabilityException, DayOfWeek } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Plus, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { SectionLoader } from '../../components/Loaders';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ProducerAvailability: React.FC = () => {
  const { user, producers, updateProducerAvailability, isInitialCatalogLoading } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const currentProducer = producers.find(p => p.id === user?.producerId);
  
  // Local State
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [newExceptionReason, setNewExceptionReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentProducer) {
      setSchedule(currentProducer.availability || {});
      setExceptions(currentProducer.exceptions || []);
    }
  }, [currentProducer]);

  // Access guard runs against the session itself, NOT against `currentProducer`
  // (which is null while the producer catalog hydrates on hard refresh).
  if (!user || user.role !== UserRole.PRODUCER) {
    return <div className="p-8 text-center">Access Denied</div>;
  }

  const isAvailabilityHydrating = !currentProducer && isInitialCatalogLoading;
  const profileMissing = !currentProducer && !isInitialCatalogLoading;

  const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
    setSchedule(prev => {
      const currentRanges = prev[day] || [{ start: '09:00', end: '17:00' }];
      const updatedRanges = currentRanges.map((range, idx) => 
        idx === 0 ? { ...range, [type]: value } : range
      );
      return { ...prev, [day]: updatedRanges };
    });
  };

  const toggleDay = (day: string) => {
    setSchedule(prev => {
      const isActive = prev[day] && prev[day].length > 0;
      if (isActive) {
        // Disable day (remove ranges)
        return { ...prev, [day]: [] };
      } else {
        // Enable day (add default range)
        return { ...prev, [day]: [{ start: '09:00', end: '17:00' }] };
      }
    });
  };

  const addException = () => {
    if (!newExceptionDate) return;
    setExceptions(prev => [...prev, { id: Date.now().toString(), date: newExceptionDate, reason: newExceptionReason || 'Off' }]);
    setNewExceptionDate('');
    setNewExceptionReason('');
  };

  const removeException = (id: string) => {
    setExceptions(prev => prev.filter(e => e.id !== id));
  };

  const handleSave = async () => {
    if (!user.producerId) return;
    try {
      setSaving(true);
      await updateProducerAvailability(user.producerId, schedule, exceptions);
      navigate('/producer/dashboard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3 flex-wrap">
         <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-primary-600 transition-colors text-sm sm:text-base">
           <ArrowLeft className="h-5 w-5 mr-1 sm:mr-2" /> Back
         </button>
         <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-primary-600"/>
            {t('avail.title')}
         </h1>
      </div>

      {isAvailabilityHydrating && (
         <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <SectionLoader message={t('form.loading')} />
         </div>
      )}

      {profileMissing && (
         <div className="bg-white shadow rounded-lg p-6 sm:p-8 text-center text-gray-600">
            Producer profile not found. Please complete your producer profile setup before configuring availability.
         </div>
      )}

      {!isAvailabilityHydrating && !profileMissing && (<>

      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
         <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-gray-400"/> {t('avail.workHours')}
         </h2>
         <div className="space-y-3 sm:space-y-4">
            {DAYS.map(day => {
               const ranges = schedule[day] || [];
               const isActive = ranges.length > 0;
               
               return (
                 <div key={day} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 rounded-md border ${isActive ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                    <div className="flex items-center min-w-[120px]">
                       <input 
                         type="checkbox" 
                         checked={isActive} 
                         onChange={() => toggleDay(day)}
                         className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                       />
                       <span className="font-medium text-gray-900">{day}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                       {isActive ? (
                         <>
                           <input 
                             type="time" 
                             value={ranges[0].start} 
                             onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                             className="border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 px-2 py-1"
                           />
                           <span className="text-gray-400">-</span>
                           <input 
                             type="time" 
                             value={ranges[0].end} 
                             onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                             className="border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 px-2 py-1"
                           />
                         </>
                       ) : (
                          <span className="text-sm text-gray-500 italic">Closed</span>
                       )}
                    </div>
                 </div>
               );
            })}
         </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
         <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">{t('avail.exceptions')}</h2>
         
         <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
            <input 
              type="date" 
              value={newExceptionDate}
              onChange={e => setNewExceptionDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900 sm:w-auto"
            />
            <input 
              type="text" 
              placeholder={t('avail.reason')}
              value={newExceptionReason}
              onChange={e => setNewExceptionReason(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
            />
            <button 
              onClick={addException}
              className="bg-gray-100 text-gray-700 p-2 rounded-md hover:bg-gray-200 inline-flex items-center justify-center sm:w-auto"
            >
               <Plus className="h-5 w-5" />
            </button>
         </div>

         <ul className="divide-y divide-gray-200">
            {exceptions.map(ex => (
               <li key={ex.id} className="py-3 flex justify-between items-center">
                  <div>
                     <p className="text-sm font-bold text-gray-900">{new Date(ex.date).toLocaleDateString()}</p>
                     <p className="text-xs text-gray-500">{ex.reason}</p>
                  </div>
                  <button onClick={() => removeException(ex.id)} className="text-red-500 hover:text-red-700" aria-label="Remove exception">
                     <Trash2 className="h-4 w-4" />
                  </button>
               </li>
            ))}
            {exceptions.length === 0 && (
               <li className="text-sm text-gray-500 italic py-2">No exceptions added.</li>
            )}
         </ul>
      </div>

      <div className="flex justify-end">
         <button 
           onClick={() => void handleSave()}
           disabled={saving}
           className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
         >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CheckCircle className="h-5 w-5" />} {saving ? t('form.saving') : t('avail.save')}
         </button>
      </div>

      </>)}
    </div>
  );
};
