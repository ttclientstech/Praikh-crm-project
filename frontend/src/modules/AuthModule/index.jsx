import useLanguage from '@/locale/useLanguage';

import { Layout, Col, Divider, Typography } from 'antd';

import AuthLayout from '@/layout/AuthLayout';
import SideContent from './SideContent';

import logo from '@/style/images/parikh-logo.png';

const { Content } = Layout;
const { Title } = Typography;

const AuthModule = ({ authContent, AUTH_TITLE, isForRegistre = false }) => {
  const translate = useLanguage();

  const getSubtitle = () => {
    switch (AUTH_TITLE) {
      case 'Sign in':
        return 'Welcome back! Please enter your details to access your account.';
      case 'Forget Password':
        return 'Enter your email to receive password reset instructions.';
      case 'Reset Password':
        return 'Please enter your new password to secure your account.';
      default:
        return 'Welcome to Parikh Renewables Solar CRM.';
    }
  };

  return (
    <AuthLayout sideContent={<SideContent />}>
      <div className="login-card-container">
        <div className="login-header">
          <Title level={2} className="login-title">
            {translate(AUTH_TITLE)}
          </Title>
          <p className="login-subtitle">
            {translate(getSubtitle())}
          </p>
        </div>
        <div className="site-layout-content">{authContent}</div>
      </div>
    </AuthLayout>
  );
};

export default AuthModule;
