import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { SubscriptionFormData, SubscriptionPeriod } from '../hooks/useSubscriptions';
import { useI18n } from '../lib/i18n';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: SubscriptionFormData) => void;
    initialData?: SubscriptionFormData | null;
}

export function SubscriptionModal({ isOpen, onClose, onSave, initialData }: SubscriptionModalProps) {
    const { lang, t } = useI18n(); // You can use this if you want to extend translations later
    const [formData, setFormData] = useState<SubscriptionFormData>({
        name: '',
        description: '',
        price: 0,
        period: 'month',
        status: true,
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                description: '',
                price: 0,
                period: 'month',
                status: true,
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-all"
                    />
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 pointer-events-auto"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {initialData ? (lang === 'kz' ? 'Жазылымды өзгерту' : 'Редактировать подписку') : (lang === 'kz' ? 'Жаңа жазылым' : 'Новая подписка')}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        {lang === 'kz' ? 'Атауы' : 'Название'}
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        placeholder="Например: Premium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        {lang === 'kz' ? 'Сипаттамасы' : 'Описание'}
                                    </label>
                                    <textarea
                                        name="description"
                                        required
                                        rows={3}
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        placeholder="Каждая новая строка будет отдельным пунктом..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            {lang === 'kz' ? 'Бағасы' : 'Цена'}
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            required
                                            min="0"
                                            value={formData.price}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            {lang === 'kz' ? 'Мерзімі' : 'Период'}
                                        </label>
                                        <select
                                            name="period"
                                            value={formData.period}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        >
                                            <option value="month">{lang === 'kz' ? 'Ай' : 'Месяц'}</option>
                                            <option value="year">{lang === 'kz' ? 'Жыл' : 'Год'}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {lang === 'kz' ? 'Статус' : 'Статус'}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {formData.status
                                                ? (lang === 'kz' ? 'Белсенді' : 'Активна')
                                                : (lang === 'kz' ? 'Сөндірулі' : 'Неактивна')}
                                        </span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="status"
                                            checked={formData.status}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                    >
                                        {lang === 'kz' ? 'Болдырмау' : 'Отмена'}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                    >
                                        {lang === 'kz' ? 'Сақтау' : 'Сохранить'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
