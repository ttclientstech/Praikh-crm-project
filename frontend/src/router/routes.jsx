import { lazy } from 'react';

import { Navigate } from 'react-router-dom';

const Logout = lazy(() => import('@/pages/Logout.jsx'));
const NotFound = lazy(() => import('@/pages/NotFound.jsx'));

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Customer = lazy(() => import('@/pages/Customer'));
const SolarProject = lazy(() => import('@/pages/SolarProject'));
const SolarProjectRead = lazy(() => import('@/pages/SolarProject/SolarProjectRead'));
const Settings = lazy(() => import('@/pages/Settings/Settings'));


const Profile = lazy(() => import('@/pages/Profile'));

const Commission = lazy(() => import('@/pages/Commission'));

let routes = {
  expense: [],
  default: [
    {
      path: '/login',
      element: <Navigate to="/" />,
    },
    {
      path: '/logout',
      element: <Logout />,
    },
    {
      path: '/commission',
      element: <Commission />,
    },
    {
      path: '/',
      element: <Dashboard />,
    },
    {
      path: '/leads',
      element: <Customer />,
    },

    {
      path: '/solarProject',
      element: <SolarProject />,
    },
    {
      path: '/solarProject/read/:id',
      element: <SolarProjectRead />,
    },

    {
      path: '/settings',
      element: <Settings />,
    },
    {
      path: '/settings/edit/:settingsKey',
      element: <Settings />,
    },


    {
      path: '/profile',
      element: <Profile />,
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ],
};

export default routes;
