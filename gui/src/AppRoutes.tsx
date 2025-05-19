import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider, theme, Spin } from 'antd';
import enUS from 'antd/lib/locale/en_US';
const { defaultAlgorithm, darkAlgorithm, compactAlgorithm } = theme;

import Loader from './core/Loader';
import RecordLinkageConfigurationFullScreen from './pages/record_linkage/RecordLinkageConfigurationFullScreen';

import { customTheme } from './styles/theme';
import loadingIconStyles from '/src/styles/loading-icon.module.scss';

import { useRecoilValue, useRecoilState } from "recoil";
import { themeAtom } from 'src/state/theme/themeAtom';
import { pageLoadingAtom } from 'src/state/app/pageLoadingAtom';

const AppRoutes = () => {
  const [themePreset, setThemePreset] = useRecoilState(themeAtom);
  const pageLoading = useRecoilValue(pageLoadingAtom);

  useEffect(() => {
    const theme = localStorage.getItem("themePreset");
    if (theme) {
      setThemePreset(theme);
    } else {
      setThemePreset('default');
    }
  }, []);

  return (
    <>
      {pageLoading && <div className={loadingIconStyles.loaderContainer}>
        <div className={loadingIconStyles.loader}></div>
      </div>
      }
      <ConfigProvider
        theme={{
          ...customTheme,
          algorithm: (themePreset === 'dark') ? darkAlgorithm :
            (themePreset === 'compact') ? compactAlgorithm : defaultAlgorithm
        }}
      >
        <BrowserRouter basename='mamba_gui'>
          <React.Fragment>
            <Loader />
            <Routes>
              <Route path="/" element={<RecordLinkageConfigurationFullScreen />}>
              </Route>
            </Routes>
          </React.Fragment>
        </BrowserRouter>
      </ConfigProvider>
    </>
  )
}

export default AppRoutes;