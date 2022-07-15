import { ipcRenderer } from 'electron';
import React, { FC, useEffect } from 'react';
import {
  HashRouter,
  Outlet,
  Route,
  Routes,
  useNavigate,
  Navigate,
} from 'react-router-dom';

import {
  CssBaseline,
  ThemeProvider,
  StyledEngineProvider,
} from '@mui/material';
import jssPreset from '@mui/styles/jssPreset';
import StylesProvider from '@mui/styles/StylesProvider';
import { create } from 'jss';
import { SnackbarProvider } from 'notistack';
import ConnectForm from './renderer/pages/ConnectForm';
import ManageConnections from './renderer/pages/ManageConnections';
import ConnectionView from './renderer/pages/ConnectionView';
import SnackbarCloseButton from './renderer/components/SnackbarCloseButton';
import { THEMES } from './shared/constants';
import createCustomTheme, { ThemeConfig } from './shared/theme';
import Layout from './renderer/pages/Layout';

const RouteListener: FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    ipcRenderer?.on('redirectTo', (_, arg) => {
      navigate(arg);
    });
    return function cleanup() {
      ipcRenderer.removeAllListeners('redirectTo');
    };
  }, []);

  return <Outlet />;
};

const jss = create({ plugins: [...jssPreset().plugins] });

const defaultSettings: ThemeConfig = {
  responsiveFontSizes: true,
  theme: THEMES.LIGHT,
};

const App: FC = () => {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={createCustomTheme(defaultSettings)}>
        <CssBaseline />
        <StylesProvider jss={jss}>
          <SnackbarProvider
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transitionDuration={{ exit: 1000 }}
            maxSnack={1}
            action={(snackbarKey) => (
              <SnackbarCloseButton snackbarKey={snackbarKey} />
            )}
          >
            <HashRouter>
              <Routes>
                <Route element={<RouteListener />}>
                  <Route element={<Layout />}>
                    <Route
                      path="/"
                      element={<Navigate to="/manage" replace />}
                    />
                    <Route path="/manage" element={<ManageConnections />} />
                    <Route
                      path="/view_connection/:connectionID"
                      element={<ConnectionView />}
                    />
                    <Route path="/connectForm" element={<ConnectForm />} />
                    <Route
                      path="/edit_connect/:connectionID"
                      element={<ConnectForm />}
                    />
                  </Route>
                </Route>
              </Routes>
            </HashRouter>
          </SnackbarProvider>
        </StylesProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default App;
