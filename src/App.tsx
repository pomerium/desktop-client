import { ipcRenderer } from 'electron';
import React, { FC } from 'react';
import {
  useHistory,
  HashRouter,
  Redirect,
  Switch,
  Route,
} from 'react-router-dom';

const Hello: FC = () => {
  const history = useHistory();
  ipcRenderer.on('redirectTo', (_, arg) => {
    history.replace(arg);
  });

  return (
    <div>
      <h3>Hello1</h3>
    </div>
  );
};

const Hello2: FC = () => {
  const history = useHistory();
  ipcRenderer.on('redirectTo', (_, arg) => {
    history.replace(arg);
  });
  return (
    <div>
      <h3>HELLO 2</h3>
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <Switch>
        <Route exact path="/">
          <Redirect to="/hello" />
        </Route>
        <Route exact path="/hello" component={Hello} />
        <Route exact path="/hello2" component={Hello2} />
      </Switch>
    </HashRouter>
  );
}
