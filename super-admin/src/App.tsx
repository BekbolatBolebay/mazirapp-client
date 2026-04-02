/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Layout } from './components/Layout';
import { CafesPage } from './components/CafesPage';
import { CategoriesPage } from './components/CategoriesPage';
import { SubscriptionsPage } from './components/SubscriptionsPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { SettingsPage } from './components/SettingsPage';
import { AnimatePresence, motion } from 'motion/react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';

export default function App() {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Routes location={location}>
            <Route path="/cafes" element={<CafesPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/cafes" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
