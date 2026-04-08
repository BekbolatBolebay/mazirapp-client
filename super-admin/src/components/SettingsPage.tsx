import React from 'react';
import { User, Globe, Palette, Shield, Camera, Lock, Bell } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { useI18n } from '@/src/lib/i18n';
import { useTheme, type PrimaryColor } from '@/src/lib/theme';

const SettingCard = ({ icon: Icon, title, description, children }: any) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
    <div className="flex items-start gap-4 mb-8">
      <div className="p-3 bg-slate-50 rounded-2xl">
        <Icon className="w-6 h-6 text-slate-600" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </div>
);

const SettingItem = ({ label, value, action }: any) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
    <button className="text-sm font-bold text-primary hover:underline">{action}</button>
  </div>
);

export const SettingsPage = () => {
  const { t, lang } = useI18n();
  const { primaryColor, setPrimaryColor, isDarkMode, toggleDarkMode, isCompactMode, toggleCompactMode } = useTheme();

  const colors: PrimaryColor[] = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#1e293b'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('settings.title')}</h1>
        <p className="text-slate-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Section */}
        <SettingCard 
          icon={User} 
          title={t('settings.section.profile')} 
          description={lang === 'kz' ? 'Сіздің жеке деректеріңіз бен аватарыңыз' : 'Ваши личные данные и аватар'}
        >
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-200 group-hover:border-primary transition-colors overflow-hidden">
                <User className="w-10 h-10 text-slate-300" />
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-lg">Lunar Tech.</h4>
              <p className="text-sm text-slate-500">{lang === 'kz' ? 'Бас әкімші' : 'Главный администратор'}</p>
              <div className="mt-3 flex gap-2">
                <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors">{lang === 'kz' ? 'Фотоны жаңарту' : 'Обновить фото'}</button>
                <button className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors">{t('action.delete')}</button>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <SettingItem label="Email" value="admin@lunartech.com" action={t('action.change')} />
            <SettingItem label={lang === 'kz' ? 'Телефон' : 'Телефон'} value="+7 (777) 123-45-67" action={t('action.change')} />
            <SettingItem label={lang === 'kz' ? 'Уақыт белдеуі' : 'Часовой пояс'} value="Алматы (GMT+5)" action={t('action.change')} />
          </div>
        </SettingCard>

        {/* Platform Settings */}
        <SettingCard 
          icon={Globe} 
          title={t('settings.section.platform')} 
          description={lang === 'kz' ? 'Жүйенің жаһандық параметрлері' : 'Глобальные параметры системы'}
        >
          <div className="space-y-1">
            <SettingItem label={lang === 'kz' ? 'Платформа атауы' : 'Название платформы'} value="CafeAdmin Pro" action={t('action.change')} />
            <SettingItem label={lang === 'kz' ? 'Әдепкі валюта' : 'Валюта по умолчанию'} value={lang === 'kz' ? 'Қазақстан теңгесі (KZT)' : 'Российский рубль (RUB)'} action={t('action.change')} />
            <SettingItem label={lang === 'kz' ? 'Интерфейс тілі' : 'Язык интерфейса'} value={lang === 'kz' ? 'Қазақша' : 'Русский'} action={t('action.change')} />
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{lang === 'kz' ? 'Техникалық қызмет көрсету' : 'Техническое обслуживание'}</p>
                <p className="text-sm font-semibold text-slate-700">{lang === 'kz' ? 'Өшірулі' : 'Выключено'}</p>
              </div>
              <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Visual Settings */}
        <SettingCard 
          icon={Palette} 
          title={t('settings.section.visual')} 
          description={lang === 'kz' ? 'Панельдің сыртқы түрі мен брендингі' : 'Внешний вид и брендинг панели'}
        >
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{lang === 'kz' ? 'Түс схемасы' : 'Цветовая схема'}</p>
              <div className="flex gap-3">
                {colors.map((color) => (
                  <button 
                    key={color} 
                    onClick={() => setPrimaryColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-xl border-2 border-white shadow-sm ring-2 ring-transparent hover:ring-slate-200 transition-all flex items-center justify-center",
                      primaryColor === color && "ring-primary scale-110"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {primaryColor === color && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-4 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">{lang === 'kz' ? 'Қараңғы тақырып' : 'Темная тема'}</span>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-300",
                  isDarkMode ? "bg-primary" : "bg-slate-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                  isDarkMode ? "right-1" : "left-1"
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between py-4 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">{lang === 'kz' ? 'Кестелердің жинақы түрі' : 'Компактный вид таблиц'}</span>
              </div>
              <button 
                onClick={toggleCompactMode}
                className={cn(
                  "w-12 h-6 rounded-full relative transition-all duration-300",
                  isCompactMode ? "bg-primary" : "bg-slate-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                  isCompactMode ? "right-1" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </SettingCard>

        {/* Security Section */}
        <SettingCard 
          icon={Shield} 
          title={t('settings.section.security')} 
          description={lang === 'kz' ? 'Аккаунтыңызды қорғау' : 'Защита вашего аккаунта'}
        >
          <div className="space-y-1">
            <SettingItem label={lang === 'kz' ? 'Құпия сөз' : 'Пароль'} value="••••••••••••" action={t('action.update')} />
            <SettingItem label={lang === 'kz' ? 'Екі факторлы аутентификация' : 'Двухфакторная аутентификация'} value={lang === 'kz' ? 'Қосулы (Google Authenticator)' : 'Включена (Google Authenticator)'} action={lang === 'kz' ? 'Баптау' : 'Настроить'} />
            <SettingItem label={lang === 'kz' ? 'Соңғы кіру' : 'Последний вход'} value={lang === 'kz' ? 'Бүгін, 12:45, IP 192.168.1.1' : 'Сегодня, 12:45 с IP 192.168.1.1'} action={lang === 'kz' ? 'Тарих' : 'История'} />
          </div>
          <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-colors">
            <Lock className="w-4 h-4" />
            <span>{lang === 'kz' ? 'Барлық сессиялардан шығу' : 'Выйти изо всех сессий'}</span>
          </button>
        </SettingCard>
      </div>
    </div>
  );
};
