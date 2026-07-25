import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

let notificationIdCounter = 0;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = ++notificationIdCounter;
    setNotifications((prev) => [...prev, { id, message, type }]);
    // Auto dismiss
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-center p-4 rounded-lg shadow-lg border-l-4 min-w-[300px] max-w-md animate-in fade-in slide-in-from-right-5 ${
              n.type === 'success' ? 'bg-white dark:bg-gray-800 border-green-500 text-gray-900 dark:text-white' :
              n.type === 'error' ? 'bg-white dark:bg-gray-800 border-red-500 text-gray-900 dark:text-white' :
              'bg-white dark:bg-gray-800 border-blue-500 text-gray-900 dark:text-white'
            }`}
          >
            <div className="mr-3">
              {n.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
              {n.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
              {n.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
            </div>
            <p className="flex-1 text-sm font-medium">{n.message}</p>
            <button onClick={() => removeNotification(n.id)} className="ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
