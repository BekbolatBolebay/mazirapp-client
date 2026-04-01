import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, TrendingDown, Users, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { useI18n } from '@/src/lib/i18n';
import { useTheme } from '@/src/lib/theme';

const REVENUE_DATA = {
  ru: [
    { name: 'Янв', revenue: 450000 },
    { name: 'Фев', revenue: 520000 },
    { name: 'Мар', revenue: 480000 },
    { name: 'Апр', revenue: 610000 },
    { name: 'Май', revenue: 750000 },
    { name: 'Июн', revenue: 820000 },
    { name: 'Июл', revenue: 950000 },
  ],
  kz: [
    { name: 'Қаң', revenue: 450000 },
    { name: 'Ақп', revenue: 520000 },
    { name: 'Нау', revenue: 480000 },
    { name: 'Сәу', revenue: 610000 },
    { name: 'Мам', revenue: 750000 },
    { name: 'Мау', revenue: 820000 },
    { name: 'Шіл', revenue: 950000 },
  ]
};

const PIE_DATA = [
  { name: 'Basic', value: 25, color: '#94a3b8' },
  { name: 'Standard', value: 45, color: '#3b82f6' },
  { name: 'Premium', value: 30, color: '#1e293b' },
];

const TRANSACTIONS = [
  { id: 1, cafe: 'Green Garden', plan: 'Premium', amount: '12,000', date: '02.03.2024', status: 'success' },
  { id: 2, cafe: 'Urban Brew', plan: 'Standard', amount: '5,500', date: '01.03.2024', status: 'success' },
  { id: 3, cafe: 'Morning Dew', plan: 'Basic', amount: '2,900', date: '28.02.2024', status: 'pending' },
  { id: 4, cafe: 'The Espresso Hub', plan: 'Premium', amount: '12,000', date: '27.02.2024', status: 'success' },
  { id: 5, cafe: 'Cozy Corner', plan: 'Standard', amount: '5,500', date: '26.02.2024', status: 'failed' },
];

const KPICard = ({ title, value, change, trend, icon: Icon }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
        <Icon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
      </div>
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
        trend === 'up' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
      )}>
        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {change}
      </div>
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</p>
  </div>
);

export const AnalyticsPage = () => {
  const { t, lang, currency } = useI18n();
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t('analytics.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('analytics.subtitle')}</p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title={t('analytics.kpi.revenue')} 
          value={`4,580,000 ${currency}`} 
          change="+12.5%" 
          trend="up" 
          icon={CreditCard} 
        />
        <KPICard 
          title={t('analytics.kpi.active_subs')} 
          value="1,240" 
          change="+5.2%" 
          trend="up" 
          icon={Users} 
        />
        <KPICard 
          title={t('analytics.kpi.new_connections')} 
          value="85" 
          change="+18.4%" 
          trend="up" 
          icon={TrendingUp} 
        />
        <KPICard 
          title={t('analytics.kpi.churn')} 
          value="12" 
          change="-2.1%" 
          trend="down" 
          icon={TrendingDown} 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('analytics.chart.revenue')}</h3>
            <select className="text-sm border-none bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 outline-none font-medium text-slate-900 dark:text-white">
              <option>{lang === 'kz' ? 'Соңғы 7 ай' : 'Последние 7 месяцев'}</option>
              <option>{lang === 'kz' ? 'Жыл бойынша' : 'За год'}</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA[lang]}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}
                  itemStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8">{t('analytics.chart.plans')}</h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white">100%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{lang === 'kz' ? 'ҮЛЕС' : 'ДОЛЯ'}</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {PIE_DATA.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('analytics.table.recent')}</h3>
          <button className="text-sm font-bold text-primary hover:underline">{t('action.view_all')}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'kz' ? 'Кафе' : 'Кафе'}</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('cafes.label.plan')}</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'kz' ? 'Сомма' : 'Сумма'}</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'kz' ? 'Күні' : 'Дата'}</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'kz' ? 'Мәртебе' : 'Статус'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-8 py-4 text-sm font-bold text-slate-900 dark:text-white">{tx.cafe}</td>
                  <td className="px-8 py-4 text-sm text-slate-500 dark:text-slate-400">{tx.plan}</td>
                  <td className="px-8 py-4 text-sm font-black text-slate-900 dark:text-white">{tx.amount} {currency}</td>
                  <td className="px-8 py-4 text-sm text-slate-500 dark:text-slate-400">{tx.date}</td>
                  <td className="px-8 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight",
                      tx.status === 'success' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : 
                      tx.status === 'pending' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                    )}>
                      {tx.status === 'success' ? (lang === 'kz' ? 'Сәтті' : 'Успешно') : tx.status === 'pending' ? (lang === 'kz' ? 'Өңделуде' : 'В обработке') : (lang === 'kz' ? 'Қате' : 'Ошибка')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
