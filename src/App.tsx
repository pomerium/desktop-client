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
  createStyles,
  CssBaseline,
  jssPreset,
  makeStyles,
  StylesProvider,
  ThemeProvider,
} from '@material-ui/core';
import { create } from 'jss';
import { SnackbarProvider } from 'notistack';
import { createMuiTheme } from './shared/theme';
import ConnectForm from './renderer/pages/ConnectForm';
import { THEMES } from './shared/constants';
import TopBar from './renderer/components/TopBar';
import ManageConnections from './renderer/pages/ManageConnections';
import TopTabs from './renderer/components/TopTabs';
import ConnectionView from './renderer/pages/ConnectionView';
import SnackbarCloseButton from './renderer/components/SnackbarCloseButton';

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

const useStyles = makeStyles(() =>
  createStyles({
    '@global': {
      '*': {
        boxSizing: 'border-box',
        margin: 0,
        padding: 0,
      },
      html: {
        '-webkit-font-smoothing': 'antialiased',
        '-moz-osx-font-smoothing': 'grayscale',
        height: '100%',
        width: '100%',
      },
      body: {
        height: '100%',
        width: '100%',
      },
      '#root': {
        height: '100%',
        width: '100%',
      },
    },
  })
);

interface Settings {
  direction?: 'ltr' | 'rtl';
  responsiveFontSizes?: boolean;
  theme?: string;
  rowCount?: number;
}

const defaultSettings: Settings = {
  responsiveFontSizes: true,
  theme: THEMES.LIGHT,
  rowCount: 25,
};

const App: FC = () => {
  useStyles();
  return (
    <ThemeProvider theme={createMuiTheme(defaultSettings)}>
      <CssBaseline />
      <StylesProvider jss={jss}>
        <SnackbarProvider
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
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
          </HashRouter>
        </SnackbarProvider>
      </StylesProvider>
    </ThemeProvider>
  );
};

export default App;
