import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const ToastContext = createContext({ showToast: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((toast) => {
    const id = crypto.randomUUID();
    const payload = { duration: 4000, tone: "info", ...toast, id };

    startTransition(() => {
      setToasts((current) => [...current, payload]);
    });

    window.setTimeout(() => removeToast(id), payload.duration);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex max-w-xl flex-col gap-3 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-panel backdrop-blur-xl ${
              toast.tone === "error"
                ? "border-threat/20 bg-panel/95 text-threat"
                : toast.tone === "success"
                  ? "border-safe/20 bg-panel/95 text-safe"
                  : "border-line/20 bg-panel/95 text-copy"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-sm opacity-80">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-full border border-current/10 px-2 py-1 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
