
import React, { useState, useEffect } from 'react';
import { useStore } from '../../services/storeContext';
import { useTranslation } from '../../services/i18nContext';
import { UserRole, WeeklySchedule, AvailabilityException, DayOfWeek } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Plus, Trash2, CheckCircle } from 'lucide-react';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ProducerAvailability: React.FC = () => {
  const { user, producers, updateProducerAvailability } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const currentProducer = producers.find(p => p.id === user?.producerId);
  
  // Local State
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [newExceptionReason, setNewExceptionReason] = useState('');

  useEffect(() => {
    if (currentProducer) {
      setSchedule(currentProducer.availability || {});
      setExceptions(currentProducer.exceptions || []);
    }
  }, [currentProducer]);

  if (!user || user.role !== UserRole.PRODUCER || !currentProducer) {
    return <div className="p-8 text-center">Access Denied</div>;
  }

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

  const handleSave = () => {
    if (user.producerId) {
      updateProducerAvailability(user.producerId, schedule, exceptions);
      navigate('/producer/dashboard');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
         <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-primary-600 transition-colors">
           <ArrowLeft className="h-5 w-5 mr-2" /> Back
         </button>
         <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-primary-600"/>
            {t('avail.title')}
         </h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
         <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-gray-400"/> {t('avail.workHours')}
         </h2>
         <div className="space-y-4">
            {DAYS.map(day => {
               const ranges = schedule[day] || [];
               const isActive = ranges.length > 0;
               
               return (
                 <div key={day} className={`flex items-center justify-between p-3 rounded-md border ${isActive ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                    <div className="flex items-center min-w-[120px]">
                       <input 
                         type="checkbox" 
                         checked={isActive} 
                         onChange={() => toggleDay(day)}
                         className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                       />
                       <span className="font-medium text-gray-900">{day}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                       {isActive ? (
                         <>
                           <input 
                             type="time" 
                             value={ranges[0].start} 
                             onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                             className="border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                           />
                           <span className="text-gray-400">-</span>
                           <input 
                             type="time" 
                             value={ranges[0].end} 
                             onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                             className="border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
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

      <div className="bg-white shadow rounded-lg p-6 mb-8">
         <h2 className="text-lg font-medium text-gray-900 mb-4">{t('avail.exceptions')}</h2>
         
         <div className="flex gap-3 mb-4">
            <input 
              type="date" 
              value={newExceptionDate}
              onChange={e => setNewExceptionDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
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
              className="bg-gray-100 text-gray-700 p-2 rounded-md hover:bg-gray-200"
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
                  <button onClick={() => removeException(ex.id)} className="text-red-500 hover:text-red-700">
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
           onClick={handleSave}
           className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
         >
            <CheckCircle className="h-5 w-5 mr-2" /> {t('avail.save')}
         </button>
      </div>
    </div>
  );
};
