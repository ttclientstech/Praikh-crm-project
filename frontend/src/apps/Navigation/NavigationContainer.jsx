import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Drawer, Layout, Menu, Avatar } from 'antd';
import { useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import '@/style/DashboardRedesign.css';


import { useAppContext } from '@/context/appContext';

import useLanguage from '@/locale/useLanguage';



import useResponsive from '@/hooks/useResponsive';

import {
  SettingOutlined,
  CustomerServiceOutlined,
  ContainerOutlined,
  FileSyncOutlined,
  DashboardOutlined,
  TagOutlined,
  TagsOutlined,
  UserOutlined,
  CreditCardOutlined,
  MenuOutlined,
  FileOutlined,
  ShopOutlined,
  FilterOutlined,
  WalletOutlined,
  ReconciliationOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

export default function Navigation() {
  const { isMobile } = useResponsive();

  return isMobile ? <MobileSidebar /> : <Sidebar collapsible={false} />;
}

function Sidebar({ collapsible, isMobile = false }) {
  let location = useLocation();

  const { state: stateApp, appContextAction } = useAppContext();
  const { isNavMenuClose } = stateApp;
  const { navMenu } = appContextAction;
  const [showLogoApp, setLogoApp] = useState(isNavMenuClose);
  const [currentPath, setCurrentPath] = useState(location.pathname.slice(1));

  const translate = useLanguage();
  const navigate = useNavigate();

  const items = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to={'/'}>{translate('dashboard')}</Link>,
    },
    {
      key: 'leads',
      icon: <CustomerServiceOutlined />,
      label: <Link to={'/leads'}>{translate('Leads')}</Link>,
    },

    {
      key: 'solarProject',
      icon: <ContainerOutlined />,
      label: <Link to={'/solarProject'}>{'Solar Projects'}</Link>,
    },
    {
      key: 'quotation',
      icon: <FileTextOutlined />,
      label: <a href="https://www.parikhrenewable.com/admin/quotator" target="_blank" rel="noopener noreferrer">Quotation</a>,
    },



    {
      key: 'commission',
      label: <Link to={'/commission'}>{'Commission'}</Link>, // Hardcoded label as requested
      icon: <ReconciliationOutlined />,
    },
  ];

  useEffect(() => {
    if (location)
      if (currentPath !== location.pathname) {
        if (location.pathname === '/') {
          setCurrentPath('dashboard');
        } else setCurrentPath(location.pathname.slice(1));
      }
  }, [location, currentPath]);

  useEffect(() => {
    if (isNavMenuClose) {
      setLogoApp(isNavMenuClose);
    }
    const timer = setTimeout(() => {
      if (!isNavMenuClose) {
        setLogoApp(isNavMenuClose);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isNavMenuClose]);
  const onCollapse = () => {
    navMenu.collapse();
  };

  const currentAdmin = useSelector(selectCurrentAdmin);

  return (
    <Sider
      collapsible={collapsible}
      collapsed={collapsible ? isNavMenuClose : collapsible}
      onCollapse={onCollapse}
      className="navy-sidebar"
      width={260}
      style={{
        overflow: 'hidden',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
      theme={'dark'}
      trigger={null}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="user-profile-section">
          <img
            src="/images/icon.png"
            alt="Logo"
            style={{
              width: '64px',
              height: 'auto',
              marginBottom: '12px',
              borderRadius: '8px'
            }}
          />
          <div className="user-name">
            {currentAdmin?.name || 'Admin User'}
          </div>
          <div className="user-email">
            {currentAdmin?.email || 'admin@solar.com'}
          </div>
        </div>

        <Menu
          items={items}
          mode="inline"
          theme={'dark'}
          selectedKeys={[currentPath]}
          className="navy-menu"
          style={{
            background: 'transparent',
            borderRight: 'none',
            flex: 1, // Push footer down
            overflowY: 'auto'
          }}
        />

        <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', background: '#001529' }}>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', marginBottom: '8px' }}>Created by</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <img src="/images/talentlogo.png" alt="Talentronaut" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            <a href="https://www.talentronaut.in/" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontSize: '11px', lineHeight: '1.2', textAlign: 'left', fontWeight: '500' }}>
              Talentronaut Technologies Pvt Ltd
            </a>
          </div>
        </div>
      </div>
    </Sider>
  );
}

function MobileSidebar() {
  const [visible, setVisible] = useState(false);
  const showDrawer = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };

  return (
    <>
      <div className="mobile-header-container">
        <Button
          type="text"
          size="large"
          onClick={showDrawer}
          className="mobile-sidebar-btn"
        >
          <MenuOutlined style={{ fontSize: 18 }} />
        </Button>
        <h1 className="mobile-header-title">Company Dashboard</h1>
      </div>
      <Drawer
        width={250}
        placement={'left'}
        closable={false}
        onClose={onClose}
        open={visible}
      >
        <Sidebar collapsible={false} isMobile={true} />
      </Drawer>
    </>
  );
}
