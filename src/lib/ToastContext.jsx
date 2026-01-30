import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext({});

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const show = useCallback((message, type = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const success = (msg) => show(msg, 'success');
    const error = (msg) => show(msg, 'error');

    return (
        <ToastContext.Provider value={{ show, success, error }}>
            {children}
            <div style={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                zIndex: 9999
            }}>
                {toasts.map((toast) => (
                    <div key={toast.id} style={{
                        background: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#22c55e' : '#333',
                        color: '#fff',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        fontSize: '14px',
                        fontWeight: '500',
                        animation: 'fadeIn 0.3s ease-out',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {toast.message}
                    </div>
                ))}
            </div>
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </ToastContext.Provider>
    );
}
