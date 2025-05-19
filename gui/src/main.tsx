import React from 'react'
import ReactDOM from 'react-dom/client'
import { RecoilRoot } from 'recoil';

import AppRoutes from './AppRoutes'
import 'antd/dist/reset.css';
import 'src/styles/app.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <RecoilRoot>
    <AppRoutes />
  </RecoilRoot>
  // </React.StrictMode>
)
