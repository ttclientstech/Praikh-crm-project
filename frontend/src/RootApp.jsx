import './style/app.css';

import { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '@/redux/store';
import PageLoader from '@/components/PageLoader';
import DesktopOnlyScreen from '@/components/DesktopOnlyScreen';

const IdurarOs = lazy(() => import('./apps/IdurarOs'));

export default function RoutApp() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkIfDesktop = () => {
      // Check if screen width is less than 1024px (tablet/mobile)
      const isMobileOrTablet = window.innerWidth < 1024;
      setIsDesktop(!isMobileOrTablet);
    };

    // Check on mount
    checkIfDesktop();

    // Check on resize
    window.addEventListener('resize', checkIfDesktop);

    return () => window.removeEventListener('resize', checkIfDesktop);
  }, []);

  // Show desktop-only screen on mobile/tablet
  if (!isDesktop) {
    return <DesktopOnlyScreen />;
  }

  return (
    <BrowserRouter>
      <Provider store={store}>
        <Suspense fallback={null}>
          <IdurarOs />
        </Suspense>
      </Provider>
    </BrowserRouter>
  );
}
