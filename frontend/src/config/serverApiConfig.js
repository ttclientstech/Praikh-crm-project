export const API_BASE_URL =
  import.meta.env.PROD || import.meta.env.VITE_DEV_REMOTE == 'remote'
    ? import.meta.env.VITE_BACKEND_SERVER + '/api/'
    : 'http://localhost:8888/api/';

const base_url =
  import.meta.env.PROD || import.meta.env.VITE_DEV_REMOTE
    ? import.meta.env.VITE_BACKEND_SERVER
    : 'http://localhost:8888/';

export const BASE_URL = base_url.endsWith('/') ? base_url : base_url + '/';

export const WEBSITE_URL = import.meta.env.PROD
  ? 'http://cloud.idurarapp.com/'
  : 'http://localhost:3000/';
export const DOWNLOAD_BASE_URL =
  import.meta.env.PROD || import.meta.env.VITE_DEV_REMOTE
    ? (import.meta.env.VITE_BACKEND_SERVER.endsWith('/') 
        ? import.meta.env.VITE_BACKEND_SERVER + 'download/' 
        : import.meta.env.VITE_BACKEND_SERVER + '/download/')
    : 'http://localhost:8888/download/';
export const ACCESS_TOKEN_NAME = 'x-auth-token';

const file_base_url =
  import.meta.env.PROD || import.meta.env.VITE_DEV_REMOTE
    ? import.meta.env.VITE_FILE_BASE_URL
    : 'http://localhost:8888/';

export const FILE_BASE_URL = file_base_url.endsWith('/') ? file_base_url : file_base_url + '/';

//  console.log(
//    '🚀 Welcome to IDURAR ERP CRM! Did you know that we also offer commercial customization services? Contact us at hello@idurarapp.com for more information.'
//  );
