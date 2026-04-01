import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'kz' | 'ru';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

export const translations: Translations = {
  // Sidebar & Navigation
  'nav.cafes': { kz: 'Басты бет', ru: 'Главная страница' },
  'nav.subscriptions': { kz: 'Жазылымдар', ru: 'Подписки' },
  'nav.analytics': { kz: 'Талдау', ru: 'Аналитика' },
  'nav.settings': { kz: 'Баптаулар', ru: 'Настройки' },
  'nav.logout': { kz: 'Шығу', ru: 'Выйти' },
  'nav.admin': { kz: 'Супер Админ', ru: 'Супер Админ' },

  // General Actions
  'action.add_cafe': { kz: 'Кафе қосу', ru: 'Добавить кафе' },
  'action.details': { kz: 'Толығырақ', ru: 'Подробнее' },
  'action.search': { kz: 'Іздеу...', ru: 'Поиск...' },
  'action.reset_filters': { kz: 'Сүзгілерді тастау', ru: 'Сбросить фильтры' },
  'action.edit': { kz: 'Өңдеу', ru: 'Редактировать' },
  'action.delete': { kz: 'Жою', ru: 'Удалить' },
  'action.create_plan': { kz: 'Тариф жасау', ru: 'Создать тариф' },
  'action.view_all': { kz: 'Барлығын көру', ru: 'Смотреть все' },
  'action.change': { kz: 'Өзгерту', ru: 'Изменить' },
  'action.update': { kz: 'Жаңарту', ru: 'Обновить' },
  'action.save': { kz: 'Сақтау', ru: 'Сохранить' },

  // Cafes Page
  'cafes.title': { kz: 'Кафелер', ru: 'Кафе' },
  'cafes.subtitle': { kz: 'Желіні және жазылымдарды басқару', ru: 'Управление сетью заведений и подписками' },
  'cafes.filter.city': { kz: 'Барлық қалалар', ru: 'Все города' },
  'cafes.filter.status': { kz: 'Барлық мәртебелер', ru: 'Все статусы' },
  'cafes.status.active': { kz: 'Белсенді', ru: 'Активен' },
  'cafes.status.expired': { kz: 'Мерзімі бітті', ru: 'Истек' },
  'cafes.status.warning': { kz: 'Аяқталуда', ru: 'Заканчивается' },
  'cafes.label.plan': { kz: 'Тариф', ru: 'Тариф' },
  'cafes.label.expiry': { kz: 'Аяқталуы', ru: 'Окончание' },

  // Subscriptions Page
  'subs.title': { kz: 'Жазылымдар', ru: 'Подписки' },
  'subs.subtitle': { kz: 'Тарифтік жоспарлар мен бағаны басқару', ru: 'Управление тарифными планами и ценообразованием' },
  'subs.popular': { kz: 'Танымал', ru: 'Популярный' },
  'subs.connected': { kz: 'қосылған кафе', ru: 'подключенных кафе' },

  // Analytics Page
  'analytics.title': { kz: 'Талдау', ru: 'Аналитика' },
  'analytics.subtitle': { kz: 'Платформаның қаржылық көрсеткіштеріне шолу', ru: 'Обзор финансовых показателей платформы' },
  'analytics.kpi.revenue': { kz: 'Жалпы табыс', ru: 'Общий доход' },
  'analytics.kpi.active_subs': { kz: 'Белсенді жазылымдар', ru: 'Активные подписки' },
  'analytics.kpi.new_connections': { kz: 'Жаңа қосылымдар', ru: 'Новые подключения' },
  'analytics.kpi.churn': { kz: 'Кетулер', ru: 'Оттоки' },
  'analytics.chart.revenue': { kz: 'Табыс динамикасы', ru: 'Динамика дохода' },
  'analytics.chart.plans': { kz: 'Тарифтер бойынша табыс', ru: 'Доход по тарифам' },
  'analytics.table.recent': { kz: 'Соңғы транзакциялар', ru: 'Последние транзакции' },

  // Settings Page
  'settings.title': { kz: 'Баптаулар', ru: 'Настройки' },
  'settings.subtitle': { kz: 'Профиль мен платформа параметрлерін басқару', ru: 'Управление профилем и параметрами платформы' },
  'settings.section.profile': { kz: 'Профиль', ru: 'Профиль' },
  'settings.section.platform': { kz: 'Платформа баптаулары', ru: 'Настройки платформы' },
  'settings.section.visual': { kz: 'Визуалды баптаулар', ru: 'Визуальные настройки' },
  'settings.section.security': { kz: 'Қауіпсіздік', ru: 'Безопасность' },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  currency: string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved as Language) || 'kz';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const t = (key: string) => {
    return translations[key]?.[lang] || key;
  };

  const currency = lang === 'kz' ? '₸' : '₽';

  return (
    <I18nContext.Provider value={{ lang, setLang, t, currency }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
};
