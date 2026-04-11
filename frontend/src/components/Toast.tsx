import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle, XCircle } from 'lucide-react'
import type { ToastItem } from '@/contexts/ToastContext'

interface Props {
  items: ToastItem[]
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export default function ToastStack({ items }: Props) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ y: -48, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -48, opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`pointer-events-auto flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-lg text-sm font-medium whitespace-nowrap ${
              item.variant === 'error'
                ? 'bg-red-600 text-white'
                : item.variant === 'loading'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-green-600 text-white'
            }`}
          >
            {item.variant === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
            {item.variant === 'error'   && <XCircle className="w-4 h-4 flex-shrink-0" />}
            {item.variant === 'loading' && <Spinner />}
            <span>{item.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
