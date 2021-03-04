import { ipcRenderer } from 'electron';
import React, { FC } from 'react';
import {
  useHistory,
  HashRouter,
  Redirect,
  Switch,
  Route,
} from 'react-router-dom';

import {
  createStyles,
  jssPreset,
  makeStyles,
  StylesProvider,
  ThemeProvider,
} from '@material-ui/core';
import { create } from 'jss';
import { createTheme } from './utils/theme';
import ConnectForm from './pages/ConnectForm';
import { THEMES } from './utils/constants';

const RouteListener: FC = (x) => {
  const history = useHistory();
  ipcRenderer?.on('redirectTo', (_, arg) => {
    history.replace(arg);
  });
  return <>{x.children}</>;
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
    <ThemeProvider theme={createTheme(defaultSettings)}>
      <StylesProvider jss={jss}>
        <HashRouter>
          <Switch>
            <RouteListener>
              <Route exact path="/">
                <Redirect to="/connect" />
              </Route>
              <Route exact path="/connect" component={ConnectForm} />
              <Route
                path="/edit_connect/:channelId/:editingConnected"
                component={ConnectForm}
              />
            </RouteListener>
          </Switch>
        </HashRouter>
      </StylesProvider>
    </ThemeProvider>
  );
};

export default App;
