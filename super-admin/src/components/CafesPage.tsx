import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  MapPin,
  Calendar,
  ChevronRight,
  MoreVertical,
  CreditCard,
  Bell,
  Clock,
  ShieldBan,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Menu,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '@/src/lib/i18n';
import { useSubscriptions, Subscription } from '@/src/hooks/useSubscriptions';
import { useCategories } from '@/src/hooks/useCategories';
import { cafesService, Cafe } from '@/src/services/cafesService';
import { categoriesService } from '@/src/services/categoriesService';

type CafeStatus = 'active' | 'warning' | 'expired' | 'blocked';

export const CafesPage = () => {
  const { t, lang } = useI18n();
  const { subscriptions } = useSubscriptions();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [manageCafe, setManageCafe] = useState<Cafe | null>(null);
  const [manageFreeDays, setManageFreeDays] = useState<number>(0);

  const [planCafe, setPlanCafe] = useState<Cafe | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const [notifyCafe, setNotifyCafe] = useState<Cafe | null>(null);
  const [notifySubject, setNotifySubject] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');

  const [blockCafe, setBlockCafe] = useState<Cafe | null>(null);
  const [blockDays, setBlockDays] = useState<number>(1);
  const [blockReason, setBlockReason] = useState('');

  const [deleteCafe, setDeleteCafe] = useState<Cafe | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const [highlightCafeId, setHighlightCafeId] = useState<string | null>(null);

  const [detailsCafe, setDetailsCafe] = useState<Cafe | null>(null);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'menu'>('overview');

  const { categories } = useCategories();
  const [assignCatCafe, setAssignCatCafe] = useState<Cafe | null>(null);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const IS_SUPER_ADMIN = true;

  /**
   * Fetch cafes from API
   */
  useEffect(() => {
    const fetchCafes = async () => {
      setIsLoading(true);
      console.log('🔄 [CafesPage] Starting to fetch cafes...');
      try {
        const data = await cafesService.getCafes();
        console.log('✅ [CafesPage] Fetch successful, got', data?.length || 0, 'cafes');
        console.log('📊 [CafesPage] Data:', data);
        setCafes(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load cafes';
        console.error('❌ [CafesPage] Fetch failed:', message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCafes();
  }, []);

  useEffect(() => {
    const now = new Date();
    setCafes(prev =>
      prev.map(cafe => {
        if (cafe.status === 'blocked' && cafe.blockUntil) {
          const until = new Date(cafe.blockUntil);
          if (until <= now) {
            return {
              ...cafe,
              status: 'active',
              blockUntil: null,
              blockReason: null,
            };
          }
        }
        return cafe;
      }),
    );

    const interval = setInterval(() => {
      setCafes(prev =>
        prev.map(cafe => {
          if (cafe.status === 'blocked' && cafe.blockUntil) {
            const until = new Date(cafe.blockUntil);
            if (until <= new Date()) {
              return {
                ...cafe,
                status: 'active',
                blockUntil: null,
                blockReason: null,
              };
            }
          }
          return cafe;
        }),
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (highlightCafeId == null) return;
    const id = setTimeout(() => setHighlightCafeId(null), 2000);
    return () => clearTimeout(id);
  }, [highlightCafeId]);

  useEffect(() => {
    if (!detailsCafe) return;
    const updated = cafes.find(c => c.id === detailsCafe.id);
    if (updated) {
      setDetailsCafe(updated);
    }
  }, [cafes, detailsCafe]);

  const formatDate = (value: string) => {
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU');
    } catch {
      return value;
    }
  };

  const adjustExpiry = (cafe: Cafe, days: number) => {
    if (!days || days <= 0) return;
    const base = new Date(cafe.expiry);
    if (Number.isNaN(base.getTime())) return;
    base.setDate(base.getDate() + days);
    const updatedExpiry = base.toISOString().slice(0, 10);
    setCafes(prev =>
      prev.map(c => (c.id === cafe.id ? { ...c, expiry: updatedExpiry } : c)),
    );
  };

  const openManageModal = (cafe: Cafe) => {
    setManageCafe(cafe);
    setManageFreeDays(0);
    setOpenMenuId(null);
  };

  const openPlanModal = (cafe: Cafe) => {
    setPlanCafe(cafe);
    const currentSub =
      subscriptions.find(sub => sub.name === cafe.plan) || subscriptions[0];
    setSelectedPlanId(currentSub ? currentSub.id : '');
  };

  const openNotifyModal = (cafe: Cafe) => {
    setNotifyCafe(cafe);
    setNotifySubject('');
    setNotifyMessage('');
    setOpenMenuId(null);
  };

  const openBlockModal = (cafe: Cafe) => {
    setBlockCafe(cafe);
    setBlockDays(1);
    setBlockReason('');
    setOpenMenuId(null);
  };

  const openDeleteModal = (cafe: Cafe) => {
    setDeleteCafe(cafe);
    setOpenMenuId(null);
  };

  const handleNotifySend = async () => {
    if (!notifyCafe) return;
    if (!notifySubject.trim() || !notifyMessage.trim()) return;

    try {
      await cafesService.notifyCafe(
        notifyCafe.id,
        notifySubject.trim(),
        notifyMessage.trim()
      );

      // Update local state to reflect the notification being sent
      setCafes(prev =>
        prev.map(c =>
          c.id === notifyCafe.id
            ? {
              ...c,
              notifications: [
                {
                  subject: notifySubject.trim(),
                  message: notifyMessage.trim(),
                  createdAt: new Date().toISOString(),
                },
                ...(c.notifications || []),
              ],
            }
            : c,
        ),
      );

      setToast(
        lang === 'kz'
          ? 'Хабарлама иесіне жіберілді'
          : 'Уведомление отправлено владельцу',
      );
      setNotifyCafe(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send notification';
      console.error('Failed to send notification:', message);
      setToast(
        lang === 'kz'
          ? 'Хабарламаны жіберу сәтсіз болды'
          : 'Ошибка при отправке уведомления',
      );
    }
  };

  const handleBlockConfirm = async () => {
    if (!blockCafe) return;
    if (!blockDays || blockDays <= 0) return;

    try {
      const updated = await cafesService.blockCafe(
        blockCafe.id,
        blockDays,
        blockReason.trim()
      );

      setCafes(prev =>
        prev.map(c =>
          c.id === blockCafe.id ? updated : c
        ),
      );

      setToast(
        lang === 'kz'
          ? 'Кафе уақытша бұғатталды'
          : 'Кафе временно заблокировано',
      );
      setBlockCafe(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to block cafe';
      console.error('Failed to block cafe:', message);
      setToast(
        lang === 'kz'
          ? 'Кафені бұғаттау сәтсіз болды'
          : 'Ошибка при блокировке кафе',
      );
    }
  };

const handleDeleteConfirm = async () => {
  if (!deleteCafe) return;

  try {
    await cafesService.deleteCafe(deleteCafe.id);
    setCafes(prev => prev.filter(c => c.id !== deleteCafe.id));
    setToast(
      lang === 'kz' ? 'Кафе жойылды' : 'Кафе успешно удалено из системы',
    );
    setDeleteCafe(null);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete cafe';
    console.error('Failed to delete cafe:', message);
    setToast(
      lang === 'kz'
        ? 'Кафені жою сәтсіз болды'
        : 'Ошибка при удалении кафе',
    );
  }
};

const openAssignModal = (cafe: Cafe) => {
  setAssignCatCafe(cafe);
  setSelectedCatIds([]);
  setOpenMenuId(null);
};

const handleAssignCategories = async () => {
  if (!assignCatCafe || selectedCatIds.length === 0) return;
  setIsAssigning(true);
  try {
    await categoriesService.assignToCafe(assignCatCafe.id, selectedCatIds);
    setToast(lang === 'kz' ? 'Категориялар сәтті қосылды' : 'Категории успешно привязаны к кафе');
    setAssignCatCafe(null);
  } catch (err) {
    setToast(lang === 'kz' ? 'Қате орын алды' : 'Ошибка при привязке категорий');
  } finally {
    setIsAssigning(false);
  }
};

return (
  <div
    className="space-y-8"
    onClick={() => {
      if (openMenuId !== null) setOpenMenuId(null);
    }}
  >
    {/* Header Section */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t('cafes.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('cafes.subtitle')}</p>
      </div>
      <button className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95">
        <Plus className="w-5 h-5" />
        <span>{t('action.add_cafe')}</span>
      </button>
    </div>

    {/* Filters Section */}
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder={t('action.search')}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary/20 rounded-xl text-sm transition-all outline-none text-slate-900 dark:text-white"
        />
      </div>
      <select className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary/20 rounded-xl text-sm transition-all outline-none appearance-none cursor-pointer text-slate-900 dark:text-white">
        <option value="">{t('cafes.filter.city')}</option>
        <option value="almaty">Алматы</option>
        <option value="astana">Астана</option>
        <option value="shymkent">Шымкент</option>
      </select>
      <select className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary/20 rounded-xl text-sm transition-all outline-none appearance-none cursor-pointer text-slate-900 dark:text-white">
        <option value="">{t('cafes.filter.status')}</option>
        <option value="active">{t('cafes.status.active')}</option>
        <option value="expired">{t('cafes.status.expired')}</option>
        <option value="warning">{t('cafes.status.warning')}</option>
      </select>
      <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-all">
        <Filter className="w-4 h-4" />
        <span>{t('action.reset_filters')}</span>
      </button>
    </div>

    {/* Cafes Grid/List */}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {cafes.map((cafe, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          key={cafe.id}
          className={cn(
            "group relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-primary/5 transition-all duration-300",
            cafe.status === 'blocked' && "opacity-60 grayscale"
          )}
        >
          <div className="flex items-start gap-5">
            <div className="relative">
              <img
                src={cafe.logo}
                alt={cafe.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-100 dark:border-slate-800"
                referrerPolicy="no-referrer"
              />
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900",
                cafe.status === 'active'
                  ? "bg-emerald-500"
                  : cafe.status === 'warning'
                    ? "bg-amber-500"
                    : "bg-rose-500"
              )} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                  {cafe.name}
                </h3>
                {IS_SUPER_ADMIN && (
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() =>
                        setOpenMenuId(prev => (prev === cafe.id ? null : cafe.id))
                      }
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                      {openMenuId === cafe.id && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 z-20 overflow-hidden"
                        >
                          <div className="py-1">
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              onClick={() => openManageModal(cafe)}
                            >
                              <CreditCard className="w-4 h-4 text-primary" />
                              <span>
                                {lang === 'kz'
                                  ? 'Жазылымды басқару'
                                  : 'Управление подпиской'}
                              </span>
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              onClick={() => openNotifyModal(cafe)}
                            >
                              <Bell className="w-4 h-4 text-amber-500" />
                              <span>
                                {lang === 'kz'
                                  ? 'Иесіне хабарлама жіберу'
                                  : 'Отправить уведомление владельцу'}
                              </span>
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              onClick={() => openBlockModal(cafe)}
                            >
                              <ShieldBan className="w-4 h-4 text-rose-500" />
                              <span>
                                {lang === 'kz'
                                  ? 'Уақытша бұғаттау'
                                  : 'Заблокировать на время'}
                              </span>
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              onClick={() => openAssignModal(cafe)}
                            >
                              <Menu className="w-4 h-4 text-emerald-500" />
                              <span>
                                {lang === 'kz'
                                  ? 'Категорияларды қосу'
                                  : 'Добавить категории'}
                              </span>
                            </button>
                          </div>
                          <div className="h-px bg-slate-100 dark:bg-slate-800" />
                          <div className="py-1">
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              onClick={() => openDeleteModal(cafe)}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>
                                {lang === 'kz' ? 'Кафені жою' : 'Удалить кафе'}
                              </span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{cafe.city}, {cafe.address}</span>
                </div>
              </div>

              <div
                className={cn(
                  "relative grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 transition-colors duration-500",
                  highlightCafeId === cafe.id &&
                  "bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700",
                )}
              >
                {highlightCafeId === cafe.id && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {lang === 'kz' ? 'Жаңартылды' : 'Обновлено'}
                  </span>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{t('cafes.label.plan')}</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cafe.plan}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{t('cafes.label.expiry')}</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        cafe.status === 'expired'
                          ? "text-rose-600 dark:text-rose-400"
                          : cafe.status === 'warning'
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-700 dark:text-slate-200"
                      )}
                    >
                      {formatDate(cafe.expiry)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight",
                  cafe.status === 'active'
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                    : cafe.status === 'warning'
                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                      : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                )}
              >
                {cafe.status === 'active'
                  ? t('cafes.status.active')
                  : cafe.status === 'warning'
                    ? t('cafes.status.warning')
                    : cafe.status === 'blocked'
                      ? lang === 'kz'
                        ? 'Уақытша бұғатталған'
                        : 'Временно заблокировано'
                      : t('cafes.status.expired')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {IS_SUPER_ADMIN && cafe.status === 'blocked' && (
                <button
                  onClick={() => {
                    setCafes(prev =>
                      prev.map(c =>
                        c.id === cafe.id
                          ? {
                            ...c,
                            status: 'active',
                            blockUntil: null,
                            blockReason: null,
                          }
                          : c,
                      ),
                    );
                    setToast(
                      lang === 'kz'
                        ? 'Кафе бұғаттаудан шығарылды'
                        : 'Кафе разблокировано',
                    );
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-500/70 bg-emerald-50 text-xs font-semibold text-emerald-700 px-3 py-1.5 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-600 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <ShieldBan className="w-3.5 h-3.5" />
                  <span>{lang === 'kz' ? 'Бұғаттаудан шығару' : 'Разблокировать'}</span>
                </button>
              )}
              <button
                onClick={e => {
                  e.stopPropagation();
                  setDetailsCafe(cafe);
                  setDetailsTab('overview');
                }}
                className="flex items-center gap-1 text-sm font-bold text-primary hover:gap-2 transition-all"
              >
                <span>{t('action.details')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Manage Subscription Modal */}
    <AnimatePresence>
      {manageCafe && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setManageCafe(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="pointer-events-auto w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {lang === 'kz' ? 'Жазылымды басқару' : 'Управление подпиской'}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {manageCafe.name}
                  </p>
                </div>
                <button
                  onClick={() => setManageCafe(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 pt-5 pb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                      {lang === 'kz' ? 'Ағымдағы тариф' : 'Текущий тариф'}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {manageCafe.plan}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                      {lang === 'kz' ? 'Аяқталу күні' : 'Дата окончания'}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatDate(manageCafe.expiry)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {IS_SUPER_ADMIN && (
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 active:scale-[0.98] transition"
                      onClick={() => openPlanModal(manageCafe)}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{lang === 'kz' ? 'Тарифті өзгерту' : 'Сменить тариф'}</span>
                    </button>
                  )}
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-white px-4 py-2.5 text-sm font-semibold hover:bg-primary-hover shadow-md shadow-primary/20 active:scale-[0.98] transition"
                    onClick={() => {
                      adjustExpiry(manageCafe, 30);
                      setToast(
                        lang === 'kz'
                          ? 'Жазылым 30 күнге ұзартылды'
                          : 'Подписка продлена на 30 дней',
                      );
                    }}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{lang === 'kz' ? 'Ұзарту' : 'Продлить'}</span>
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {lang === 'kz'
                      ? 'Тегін кезең қосу'
                      : 'Добавить бесплатный период'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={manageFreeDays || ''}
                        onChange={e =>
                          setManageFreeDays(Number(e.target.value) || 0)
                        }
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70 transition"
                        placeholder={lang === 'kz' ? 'Күндер саны' : 'Количество дней'}
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
                        {lang === 'kz' ? 'күн' : 'дней'}
                      </span>
                    </div>
                    <button
                      disabled={!manageFreeDays || manageFreeDays <= 0}
                      onClick={() => {
                        if (!manageCafe || !manageFreeDays || manageFreeDays <= 0) return;
                        adjustExpiry(manageCafe, manageFreeDays);
                        setToast(
                          lang === 'kz'
                            ? 'Тегін кезең сәтті қосылды'
                            : 'Бесплатный период успешно добавлен',
                        );
                        setManageFreeDays(0);
                      }}
                      className={cn(
                        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
                        manageFreeDays && manageFreeDays > 0
                          ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/30"
                          : "bg-slate-200 text-slate-500 cursor-not-allowed",
                      )}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {lang === 'kz' ? 'Қосу' : 'Применить'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>

    {/* Cafe Details Panel */}
    <AnimatePresence>
      {detailsCafe && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={() => setDetailsCafe(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="pointer-events-auto w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-[28px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:translate-x-8 lg:translate-x-16"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    {detailsCafe.logo ? (
                      <img
                        src={detailsCafe.logo}
                        alt={detailsCafe.name}
                        className="h-10 w-10 rounded-2xl object-cover border border-slate-100 dark:border-slate-800"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-bold">
                        {detailsCafe.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 text-center">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
                      {detailsCafe.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate flex items-center justify-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {detailsCafe.city}, {detailsCafe.address}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailsCafe(null)}
                    className="hidden sm:inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {lang === 'kz' ? 'Артқа' : 'Назад'}
                  </button>
                  {IS_SUPER_ADMIN && (
                    <div className="relative">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (!detailsCafe) return;
                          setOpenMenuId(prev =>
                            prev === detailsCafe.id ? null : detailsCafe.id,
                          );
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {openMenuId === detailsCafe.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 z-50 overflow-hidden"
                          >
                            <div className="py-1">
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                onClick={e => {
                                  e.stopPropagation();
                                  if (!detailsCafe) return;
                                  openManageModal(detailsCafe);
                                  setDetailsCafe(detailsCafe);
                                }}
                              >
                                <CreditCard className="w-4 h-4 text-primary" />
                                <span>
                                  {lang === 'kz'
                                    ? 'Жазылымды басқару'
                                    : 'Управление подпиской'}
                                </span>
                              </button>
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                onClick={e => {
                                  e.stopPropagation();
                                  if (!detailsCafe) return;
                                  openNotifyModal(detailsCafe);
                                }}
                              >
                                <Bell className="w-4 h-4 text-amber-500" />
                                <span>
                                  {lang === 'kz'
                                    ? 'Иесіне хабарлама жіберу'
                                    : 'Отправить уведомление владельцу'}
                                </span>
                              </button>
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                onClick={e => {
                                  e.stopPropagation();
                                  if (!detailsCafe) return;
                                  if (detailsCafe.status === 'blocked') {
                                    // Разблокировать
                                    setCafes(prev =>
                                      prev.map(c =>
                                        c.id === detailsCafe.id
                                          ? {
                                            ...c,
                                            status: 'active',
                                            blockUntil: null,
                                            blockReason: null,
                                          }
                                          : c,
                                      ),
                                    );
                                    setToast(
                                      lang === 'kz'
                                        ? 'Кафе бұғаттаудан шығарылды'
                                        : 'Кафе разблокировано',
                                    );
                                  } else {
                                    openBlockModal(detailsCafe);
                                  }
                                }}
                              >
                                <ShieldBan className="w-4 h-4 text-rose-500" />
                                <span>
                                  {detailsCafe.status === 'blocked'
                                    ? lang === 'kz'
                                      ? 'Бұғаттаудан шығару'
                                      : 'Разблокировать'
                                    : lang === 'kz'
                                      ? 'Уақытша бұғаттау'
                                      : 'Заблокировать на время'}
                                </span>
                              </button>
                            </div>
                            <div className="h-px bg-slate-100 dark:bg-slate-800" />
                            <div className="py-1">
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                onClick={e => {
                                  e.stopPropagation();
                                  if (!detailsCafe) return;
                                  openDeleteModal(detailsCafe);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>
                                  {lang === 'kz'
                                    ? 'Кафені жою'
                                    : 'Удалить кафе'}
                                </span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  <button
                    onClick={() => setDetailsCafe(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setDetailsTab('overview')}
                  className={cn(
                    'relative px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors',
                    detailsTab === 'overview'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                  )}
                >
                  {lang === 'kz' ? 'Шолу' : 'Общее'}
                </button>
                <button
                  onClick={() => setDetailsTab('menu')}
                  className={cn(
                    'relative px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-colors',
                    detailsTab === 'menu'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
                  )}
                >
                  {lang === 'kz' ? 'Мәзір' : 'Меню'}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {detailsTab === 'overview' ? (
                  <div className="flex flex-col items-center gap-5">
                    {/* Тариф + статус по центру, над описанием */}
                    <div className="w-full max-w-xl space-y-3">
                      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-sm text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                          {lang === 'kz' ? 'Тариф' : 'Текущий тариф'}
                        </p>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                          {detailsCafe.plan}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {lang === 'kz' ? 'Аяқталуы: ' : 'Окончание: '}{' '}
                          {formatDate(detailsCafe.expiry)}
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold',
                            detailsCafe.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300',
                          )}
                        >
                          {detailsCafe.status === 'active'
                            ? t('cafes.status.active')
                            : lang === 'kz'
                              ? 'Бұғатталған'
                              : 'Заблокирован'}
                        </span>
                      </div>
                    </div>

                    {/* Описание, адрес, время работы по центру, под тарифом */}
                    <div className="w-full max-w-2xl space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1 text-center sm:text-left">
                          {lang === 'kz' ? 'Сипаттамасы' : 'Описание'}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 text-center sm:text-left">
                          {detailsCafe.description ||
                            (lang === 'kz'
                              ? 'Сипаттама әлі қосылмаған.'
                              : 'Описание пока не заполнено.')}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {lang === 'kz' ? 'Мекенжайы' : 'Адрес'}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {detailsCafe.city}, {detailsCafe.address}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {lang === 'kz' ? 'Жұмыс уақыты' : 'Время работы'}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {detailsCafe.workHours ||
                              (lang === 'kz'
                                ? 'Уақыты көрсетілмеген.'
                                : 'Время работы не указано.')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">
                      {lang === 'kz' ? 'Кафе мәзірі' : 'Меню кафе'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {lang === 'kz'
                        ? 'Мәзірді басқару функциясы кейінірек қосылады. Қазір бұл бөлім құрылымын көрсету үшін көрсетілген.'
                        : 'Функциональность управления меню будет добавлена позже. Сейчас этот раздел служит заготовкой под отдельную страницу меню внутри карточки кафе.'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>

    {/* Change Plan Modal */}
    <AnimatePresence>
      {planCafe && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPlanCafe(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="pointer-events-auto w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                    {lang === 'kz' ? 'Тарифті өзгерту' : 'Сменить тариф'}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                    {planCafe.name}
                  </p>
                </div>
                <button
                  onClick={() => setPlanCafe(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 pt-5 pb-6 space-y-5">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {lang === 'kz' ? 'Жүйедегі тарифтер' : 'Тарифы из базы данных'}
                  </p>
                  <div className="relative">
                    <select
                      value={selectedPlanId}
                      onChange={e => setSelectedPlanId(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70 transition appearance-none cursor-pointer"
                    >
                      {subscriptions.map((sub: Subscription) => {
                        const isCurrent = sub.name === planCafe.plan;
                        const periodLabel =
                          sub.period === 'month'
                            ? lang === 'kz'
                              ? 'ай'
                              : 'мес'
                            : lang === 'kz'
                              ? 'жыл'
                              : 'год';
                        const label = `${sub.name} — ${sub.price.toLocaleString(
                          lang === 'kz' ? 'kk-KZ' : 'ru-RU',
                        )} · ${periodLabel}${isCurrent ? ' • ' + (lang === 'kz' ? 'Ағымдағы' : 'Текущий') : ''}`;
                        return (
                          <option key={sub.id} value={sub.id}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                      ▾
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-900/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
                  <p className="font-semibold">
                    {lang === 'kz'
                      ? 'Өзгерісті растаңыз'
                      : 'Подтвердите изменение тарифа'}
                  </p>
                  <p className="leading-snug">
                    {lang === 'kz'
                      ? 'Тарифті өзгерткеннен кейін ағымдағы жазылым параметрлері жаңартылады, ал аяқталу күні таңдалған тарифке байланысты қайта есептеледі.'
                      : 'После смены тарифа параметры текущей подписки будут обновлены, а дата окончания будет пересчитана в зависимости от периода выбранного тарифа.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row-reverse gap-2 pt-1">
                  <button
                    disabled={!selectedPlanId || !IS_SUPER_ADMIN}
                    onClick={() => {
                      if (!planCafe || !selectedPlanId || !IS_SUPER_ADMIN) return;
                      const chosen = subscriptions.find(
                        sub => sub.id === selectedPlanId,
                      );
                      if (!chosen) return;

                      const days =
                        chosen.period === 'month'
                          ? 30
                          : chosen.period === 'year'
                            ? 365
                            : 0;
                      const base = new Date();
                      base.setDate(base.getDate() + days);
                      const newExpiry = base.toISOString().slice(0, 10);

                      setCafes(prev =>
                        prev.map(c =>
                          c.id === planCafe.id
                            ? {
                              ...c,
                              plan: chosen.name,
                              expiry: newExpiry,
                              status: 'active',
                            }
                            : c,
                        ),
                      );
                      setHighlightCafeId(planCafe.id);
                      setToast(
                        lang === 'kz'
                          ? 'Тариф сәтті өзгертілді'
                          : 'Тариф успешно изменён',
                      );
                      setPlanCafe(null);
                    }}
                    className={cn(
                      'inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]',
                      selectedPlanId && IS_SUPER_ADMIN
                        ? 'bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed',
                    )}
                  >
                    {lang === 'kz' ? 'Тарифті қолдану' : 'Применить тариф'}
                  </button>
                  <button
                    onClick={() => setPlanCafe(null)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition"
                  >
                    {lang === 'kz' ? 'Бас тарту' : 'Отмена'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>

    {/* Notify Owner Modal */}
    <AnimatePresence>
      {notifyCafe && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNotifyCafe(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="pointer-events-auto w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {lang === 'kz'
                      ? 'Иесіне хабарлама'
                      : 'Отправить уведомление владельцу'}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {notifyCafe.name}
                  </p>
                </div>
                <button
                  onClick={() => setNotifyCafe(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 pt-5 pb-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    {lang === 'kz' ? 'Тақырыбы' : 'Тема'}
                  </label>
                  <input
                    type="text"
                    value={notifySubject}
                    onChange={e => setNotifySubject(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    {lang === 'kz' ? 'Хабарлама' : 'Сообщение'}
                  </label>
                  <textarea
                    rows={5}
                    value={notifyMessage}
                    onChange={e => setNotifyMessage(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70 transition resize-none"
                  />
                </div>
                <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
                  <button
                    onClick={handleNotifySend}
                    disabled={!notifySubject.trim() || !notifyMessage.trim()}
                    className={cn(
                      "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
                      notifySubject.trim() && notifyMessage.trim()
                        ? "bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed",
                    )}
                  >
                    {lang === 'kz' ? 'Жіберу' : 'Отправить'}
                  </button>
                  <button
                    onClick={() => setNotifyCafe(null)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition"
                  >
                    {lang === 'kz' ? 'Бас тарту' : 'Отмена'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>

    {/* Temporary Block Modal */}
    <AnimatePresence>
      {blockCafe && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBlockCafe(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="pointer-events-auto w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <ShieldBan className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {lang === 'kz'
                        ? 'Уақытша бұғаттау'
                        : 'Заблокировать кафе на время'}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {blockCafe.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBlockCafe(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 pt-5 pb-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    {lang === 'kz'
                      ? 'Бұғаттау мерзімі (күндер)'
                      : 'Срок блокировки (в днях)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={blockDays || ''}
                    onChange={e => setBlockDays(Number(e.target.value) || 0)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    {lang === 'kz' ? 'Бұғаттау себебі' : 'Причина блокировки'}
                  </label>
                  <textarea
                    rows={4}
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition resize-none"
                  />
                </div>
                <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
                  <button
                    onClick={handleBlockConfirm}
                    disabled={!blockDays || blockDays <= 0}
                    className={cn(
                      "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
                      blockDays && blockDays > 0
                        ? "bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed",
                    )}
                  >
                    {lang === 'kz' ? 'Бұғаттау' : 'Заблокировать'}
                  </button>
                  <button
                    onClick={() => setBlockCafe(null)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition"
                  >
                    {lang === 'kз' ? 'Бас тарту' : 'Отмена'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>

    {/* Delete Cafe Modal */}
    <AnimatePresence>
      {deleteCafe && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteCafe(null)}
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="pointer-events-auto w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/60 shadow-2xl overflow-hidden"
            >
              <div className="px-6 pt-6 pb-5 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                  <AlertTriangle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  {lang === 'kz' ? 'Сіз сенімдісіз бе?' : 'Вы уверены?'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {lang === 'kz'
                    ? 'Бұл әрекетті қайтару мүмкін емес. Кафе жүйеден толық жойылады.'
                    : 'Это действие необратимо. Кафе будет полностью удалено из системы.'}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-5">
                  {deleteCafe.name}
                </p>
                <div className="flex flex-col см:flex-row gap-2">
                  <button
                    onClick={handleDeleteConfirm}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-rose-600 text-white px-4 py-2.5 text-sm font-semibold shadow-md shadow-rose-600/30 hover:bg-rose-700 active:scale-[0.98] transition"
                  >
                    {lang === 'kz' ? 'Иә, жою' : 'Да, удалить'}
                  </button>
                  <button
                    onClick={() => setDeleteCafe(null)}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition"
                  >
                    {lang === 'kz' ? 'Болдырмау' : 'Отмена'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>

    {/* Assign Categories Modal */}
    <AnimatePresence>
      {assignCatCafe && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isAssigning && setAssignCatCafe(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-all border-none"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 pointer-events-auto"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {lang === 'kz' ? 'Категорияларды таңдау' : 'Выбор категорий'}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {assignCatCafe.name}
                  </p>
                </div>
                <button
                  onClick={() => setAssignCatCafe(null)}
                  disabled={isAssigning}
                  className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-8 max-h-[50vh] overflow-y-auto space-y-4 custom-scrollbar">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 px-1">
                  {lang === 'kz' ? 'Бұл кафеге келесі стандартты категорияларды қосқыңыз келе ме?' : 'Добавить выбранные стандартные категории в это кафе?'}
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {categories.map(cat => (
                    <label
                      key={cat.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer group",
                        selectedCatIds.includes(cat.id)
                          ? "bg-primary/10 border-primary/40 ring-1 ring-primary/20 shadow-lg shadow-primary/5"
                          : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-primary/20 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedCatIds.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCatIds(prev => [...prev, cat.id]);
                            } else {
                              setSelectedCatIds(prev => prev.filter(id => id !== cat.id));
                            }
                          }}
                          className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                        />
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-600 shadow-sm transition-transform group-hover:scale-105">
                        {cat.icon_url ? (
                          <img src={cat.icon_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Menu className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {lang === 'kz' ? cat.name_kk : cat.name_ru}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                {categories.length === 0 && (
                  <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Menu className="w-10 h-10 text-slate-300 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-400 font-medium italic">{lang === 'kz' ? 'Категориялар табылмады' : 'Категории не найдены'}</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                <button
                  onClick={() => setAssignCatCafe(null)}
                  disabled={isAssigning}
                  className="flex-1 py-4 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  {lang === 'kz' ? 'Болдырмау' : 'Отмена'}
                </button>
                <button
                  onClick={handleAssignCategories}
                  disabled={isAssigning || selectedCatIds.length === 0}
                  className={cn(
                    "flex-1 py-4 px-6 font-bold rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2",
                    isAssigning || selectedCatIds.length === 0
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary-hover shadow-primary/25"
                  )}
                >
                  {isAssigning && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{isAssigning ? (lang === 'kz' ? 'Қосылуда...' : 'Добавление...') : (lang === 'kz' ? 'Қосу' : 'Добавить')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>

    {/* Toast */}
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-2xl shadow-slate-900/50 border border-slate-700/60"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500">
            <Check className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-medium">{toast}</p>
          <button
            onClick={() => setToast(null)}
            className="ml-1 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
};
