import React from 'react';
import { Layout, Row, Col } from 'antd';
import '@/style/LoginRedesign.css'; // Import the new styles

export default function AuthLayout({ sideContent, children }) {
  return (
    <div className="auth-layout-container">
      {/* Background is set via CSS on auth-layout-container */}
      <div className="badge-container">
        <span className="pill-badge">EST. 2024</span>
      </div>
      <div className="top-right-badge">
        <span className="pill-badge">SOLAR EPC SPECIALISTS</span>
      </div>

      <div className="auth-layout-content-wrapper">
        <div className="auth-split-left">
          {sideContent}
        </div>
        <div className="auth-split-right">
          {children}
        </div>
      </div>
    </div>
  );
}
