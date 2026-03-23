import React from 'react';

import { Layout } from 'antd';
import '@/style/DashboardRedesign.css';

const { Content } = Layout;

export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout-wrapper">
      {children}
    </div>
  );
}
