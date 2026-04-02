import React, { useState } from 'react';
import { Plus, Check, Edit2, Trash2, Menu, AlertTriangle, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../lib/i18n';
import { useCategories, Category, CategoryFormData } from '../hooks/useCategories';

export const CategoriesPage = () => {
    const { t, lang } = useI18n();
    const { categories, addCategory, updateCategory, deleteCategory, isLoading } = useCategories();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [catToDelete, setCatToDelete] = useState<Category | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [formData, setFormData] = useState<CategoryFormData>({
        name_kk: '',
        name_ru: '',
        icon_url: '',
        sort_order: 0,
        is_active: true
    });

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleOpenAdd = () => {
        setEditingCat(null);
        setFormData({
            name_kk: '',
            name_ru: '',
            icon_url: '',
            sort_order: 0,
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cat: Category) => {
        setEditingCat(cat);
        setFormData({
            name_kk: cat.name_kk,
            name_ru: cat.name_ru,
            icon_url: cat.icon_url,
            sort_order: cat.sort_order,
            is_active: cat.is_active
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCat) {
                await updateCategory(editingCat.id, formData);
                showToast(lang === 'kz' ? 'Категория жаңартылды' : 'Категория обновлена');
            } else {
                await addCategory(formData);
                showToast(lang === 'kz' ? 'Жаңа категория қосылды' : 'Новая категория добавлена');
            }
            setIsModalOpen(false);
        } catch (err) {
            showToast(lang === 'kz' ? 'Қате орын алды' : 'Произошла ошибка');
        }
    };

    const confirmDelete = async () => {
        if (catToDelete) {
            try {
                await deleteCategory(catToDelete.id);
                showToast(lang === 'kz' ? 'Категория жойылды' : 'Категория удалена');
                setCatToDelete(null);
            } catch (err) {
                showToast(lang === 'kz' ? 'Қате орын алды' : 'Произошла ошибка');
            }
        }
    };

    return (
        <div className="space-y-8 relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {lang === 'kz' ? 'Стандартты категориялар' : 'Стандартные категории'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {lang === 'kz' ? 'Платформадағы барлық кафелер үшін ортақ категорияларды басқару' : 'Управление общими категориями для всех кафе на платформе'}
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-semibold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>{lang === 'kz' ? 'Қосу' : 'Добавить'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {categories.map((cat, index) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={cat.id}
                            className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                    {cat.icon_url ? (
                                        <img src={cat.icon_url} alt={cat.name_ru} className="w-full h-full object-cover" />
                                    ) : (
                                        <Menu className="w-6 h-6 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenEdit(cat)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setCatToDelete(cat)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                    {lang === 'kz' ? cat.name_kk : cat.name_ru}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {lang === 'kz' ? 'Орысша: ' : 'На казахском: '} {lang === 'kz' ? cat.name_ru : cat.name_kk}
                                </p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {lang === 'kz' ? 'Реті: ' : 'Порядок: '} {cat.sort_order}
                                </span>
                                <div className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    cat.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                )}>
                                    {cat.is_active ? (lang === 'kz' ? 'Белсенді' : 'Активно') : (lang === 'kz' ? 'Сөндірулі' : 'Выключено')}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
                        />
                        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[60] p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 pointer-events-auto"
                            >
                                <form onSubmit={handleSave} className="p-8 space-y-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {editingCat ? (lang === 'kz' ? 'Өңдеу' : 'Редактировать') : (lang === 'kz' ? 'Жаңа категория' : 'Новая категория')}
                                        </h2>
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                            <X className="w-5 h-5 text-slate-400" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Аты (Қаз)</label>
                                                <input
                                                    required
                                                    value={formData.name_kk}
                                                    onChange={(e) => setFormData({ ...formData, name_kk: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-semibold focus:ring-2 ring-primary/20 outline-none transition-all"
                                                    placeholder="Таңғы ас"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Название (Рус)</label>
                                                <input
                                                    required
                                                    value={formData.name_ru}
                                                    onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-semibold focus:ring-2 ring-primary/20 outline-none transition-all"
                                                    placeholder="Завтраки"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Icon URL / Image</label>
                                            <div className="flex gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-shrink-0 items-center justify-center overflow-hidden">
                                                    {formData.icon_url ? (
                                                        <img src={formData.icon_url} alt="preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5 text-slate-300" />
                                                    )}
                                                </div>
                                                <input
                                                    value={formData.icon_url}
                                                    onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                                                    className="flex-1 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-semibold focus:ring-2 ring-primary/20 outline-none transition-all"
                                                    placeholder="https://example.com/icon.png"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="flex-1 space-y-1.5">
                                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">{lang === 'kz' ? 'Реті' : 'Порядок'}</label>
                                                <input
                                                    type="number"
                                                    value={formData.sort_order}
                                                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-semibold focus:ring-2 ring-primary/20 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2 pt-6">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.is_active}
                                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                        className="w-5 h-5 rounded-lg border-none bg-slate-100 dark:bg-slate-800 text-primary focus:ring-0 checked:bg-primary transition-all cursor-pointer"
                                                    />
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 transition-colors">
                                                        {lang === 'kz' ? 'Белсенді' : 'Активно'}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all"
                                    >
                                        {lang === 'kz' ? 'Сақтау' : 'Сохранить'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {catToDelete && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setCatToDelete(null)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70]"
                        />
                        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[70] p-4">
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
                                            ? `"${catToDelete.name_kk}" категориясын жоюға сенімдісіз бе? Бұл әрекетті қайтара алмайсыз.`
                                            : `Вы уверены, что хотите удалить категорию "${catToDelete.name_ru}"? Это действие необратимо.`}
                                    </p>

                                    <div className="flex gap-3 w-full">
                                        <button
                                            onClick={() => setCatToDelete(null)}
                                            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
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
                        className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-slate-900 border border-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl"
                    >
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                        <p className="font-medium pr-2 text-sm">{toastMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
