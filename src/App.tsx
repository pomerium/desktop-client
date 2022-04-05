import { ipcRenderer } from 'electron';
import React, { FC, PropsWithChildren, useEffect } from 'react';
import {
  useHistory,
  HashRouter,
  Redirect,
  Switch,
  Route,
} from 'react-router-dom';

import {
  CssBaseline,
  ThemeProvider,
  StyledEngineProvider,
  Box,
} from '@mui/material';
import jssPreset from '@mui/styles/jssPreset';
import StylesProvider from '@mui/styles/StylesProvider';
import { create } from 'jss';
import { SnackbarProvider } from 'notistack';
import ConnectForm from './renderer/pages/ConnectForm';
import TopBar from './renderer/components/TopBar';
import ManageConnections from './renderer/pages/ManageConnections';
import TopTabs from './renderer/components/TopTabs';
import ConnectionView from './renderer/pages/ConnectionView';
import SnackbarCloseButton from './renderer/components/SnackbarCloseButton';
import { THEMES } from './shared/constants';
import createCustomTheme, { ThemeConfig } from './shared/theme';

const RouteListener: FC = ({
  children,
}: PropsWithChildren<unknown>): JSX.Element => {
  const history = useHistory();

  useEffect(() => {
    ipcRenderer?.on('redirectTo', (_, arg) => {
      history.replace(arg);
    });
    return function cleanup() {
      ipcRenderer.removeAllListeners('redirectTo');
    };
  }, []);

  // eslint-disable-next-line react/destructuring-assignment
  return <>{children}</>;
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
              <TopBar>
                <TopTabs />
              </TopBar>
              <Switch>
                <RouteListener>
                  <Route exact path="/">
                    <Redirect to="/manage" />
                  </Route>
                  <Route exact path="/connectForm" component={ConnectForm} />
                  <Route
                    path="/edit_connect/:connectionID"
                    component={ConnectForm}
                  />
                  <Route
                    path="/view_connection/:connectionID"
                    component={ConnectionView}
                  />
                  <Route exact path="/manage" component={ManageConnections} />
                </RouteListener>
              </Switch>
              <Box mt={3} flexGrow={1} />
            </HashRouter>
          </SnackbarProvider>
        </StylesProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};

export default App;
