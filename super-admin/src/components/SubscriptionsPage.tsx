import React, { useState } from 'react';
import { Plus, Check, Edit2, Trash2, Star, AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../lib/i18n';
import { useSubscriptions, Subscription, SubscriptionFormData } from '../hooks/useSubscriptions';
import { SubscriptionModal } from './SubscriptionModal';

export const SubscriptionsPage = () => {
  const { t, lang, currency } = useI18n();
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useSubscriptions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  const [subToDelete, setSubToDelete] = useState<Subscription | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingSub(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setIsModalOpen(true);
  };

  const handleSave = async (data: SubscriptionFormData) => {
    try {
      if (editingSub) {
        await updateSubscription(editingSub.id, data);
        showToast(lang === 'kz' ? 'Жазылым жаңартылды' : 'Подписка успешно обновлена');
      } else {
        await addSubscription(data);
        showToast(lang === 'kz' ? 'Жаңа жазылым қосылды' : 'Новая подписка добавлена');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save subscription:', err);
      showToast(lang === 'kz' ? 'Сәтсіз болды' : 'Ошибка при сохранении');
    }
  };

  const confirmDelete = async () => {
    if (subToDelete) {
      try {
        await deleteSubscription(subToDelete.id);
        showToast(lang === 'kz' ? 'Жазылым жойылды' : 'Подписка успешно удалена');
        setSubToDelete(null);
      } catch (err) {
        console.error('Failed to delete subscription:', err);
        showToast(lang === 'kz' ? 'Сәтсіз болды' : 'Ошибка при удалении');
      }
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t('subs.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('subs.subtitle')}</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>{lang === 'kz' ? 'Қосу' : 'Добавить'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {subscriptions.map((plan, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.05 * (index % 10) }}
              key={plan.id}
              className={cn(
                "relative flex flex-col p-8 bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300",
                !plan.status && "opacity-60 grayscale-[0.5]",
                "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-primary/5"
              )}
            >
              {plan.price >= 10000 && plan.status && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-lg">
                  <Star className="w-3 h-3 fill-white" />
                  {t('subs.popular')}
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col overflow-hidden">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate" title={plan.name}>{plan.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-bold",
                      plan.status
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                      {plan.status
                        ? (lang === 'kz' ? 'Белсенді' : 'Активна')
                        : (lang === 'kz' ? 'Сөндірулі' : 'Неактивна')}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(plan.createdAt).toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(plan)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSubToDelete(plan)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price.toLocaleString()} {currency}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    /{plan.period === 'month' ? (lang === 'kz' ? 'ай' : 'мес') : (lang === 'kz' ? 'жыл' : 'год')}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.description.split('\n').filter(Boolean).map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300 leading-tight break-words">{feature}</span>
                  </div>
                ))}
                {(!plan.description || plan.description.trim() === '') && (
                  <span className="text-sm text-slate-400 italic">
                    {lang === 'kz' ? 'Сипаттама жоқ' : 'Нет описания'}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleOpenEdit(plan)}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.98]",
                  "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {t('action.edit')}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {subscriptions.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {lang === 'kz' ? 'Жазылымдар жоқ' : 'Нет подписок'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              {lang === 'kz' ? 'Жаңа жазылым қосу үшін жоғарыдағы батырманы басыңыз' : 'Добавьте первую подписку, нажав на кнопку выше'}
            </p>
          </div>
        )}
      </div>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingSub}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {subToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSubToDelete(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-all"
            />
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 pointer-events-auto p-6"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {lang === 'kz' ? 'Жоюды растау' : 'Подтвердите удаление'}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    {lang === 'kz'
                      ? `"${subToDelete.name}" жазылымын жоюға сенімдісіз бе? Бұл әрекетті қайтара алмайсыз.`
                      : `Вы уверены, что хотите удалить подписку "${subToDelete.name}"? Это действие необратимо.`}
                  </p>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setSubToDelete(null)}
                      className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {lang === 'kz' ? 'Болдырмау' : 'Отмена'}
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 py-3 px-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all active:scale-[0.98]"
                    >
                      {lang === 'kz' ? 'Жою' : 'Удалить'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <p className="font-medium pr-2 text-sm">{toastMessage}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
