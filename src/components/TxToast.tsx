import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export type TxToastState = 'idle' | 'submitting' | 'success' | 'error';

const bscScanTx = (hash: string) => `https://bscscan.com/tx/${hash}`;

/** Floating transaction feedback. Mount near the app root or inline; driven by
 *  a tx state + optional hash/message. */
export function TxToast({
  state,
  hash,
  message,
}: {
  state: TxToastState;
  hash?: string | null;
  message?: string | null;
}) {
  const { t } = useTranslation();
  const visible = state !== 'idle';

  const tone =
    state === 'error'
      ? 'border-danger/40 text-danger'
      : state === 'success'
        ? 'border-success/40 text-success'
        : 'border-border-strong text-fg';

  const label =
    state === 'submitting'
      ? t('tx.pending')
      : state === 'success'
        ? t('tx.success')
        : message || t('tx.failed');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-auto fixed bottom-5 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-xl border bg-bg-higher px-4 py-3 shadow-xl ${tone}`}
          role="status"
        >
          {state === 'submitting' && (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          <span className="text-sm font-medium">{label}</span>
          {hash && state === 'success' && (
            <a
              href={bscScanTx(hash)}
              target="_blank"
              rel="noreferrer"
              className="text-xs underline underline-offset-2 opacity-80 hover:opacity-100"
            >
              {t('common.viewOnBscScan')}
            </a>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
