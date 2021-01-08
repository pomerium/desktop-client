import { ipcRenderer } from 'electron';
import React, { FC } from 'react';
import {
  useHistory,
  HashRouter,
  Redirect,
  Switch,
  Route,
} from 'react-router-dom';
import ConnectForm from './pages/ConnectForm';

const Hello: FC = () => {
  return (
    <div>
      <h3>Hello1</h3>
    </div>
  );
};

const Hello2: FC = () => {
  return (
    <div>
      <h3>HELLO 2</h3>
    </div>
  );
};

const RouteListener: FC = (x) => {
  const history = useHistory();
  ipcRenderer.on('redirectTo', (_, arg) => {
    history.replace(arg);
  });
  return <>{x.children}</>;
};

export default function App() {
  return (
    <HashRouter>
      <Switch>
        <RouteListener>
          <Route exact path="/">
            <Redirect to="/hello" />
          </Route>
          <Route exact path="/hello" component={Hello} />
          <Route exact path="/hello2" component={Hello2} />
          <Route exact path="/connect" component={ConnectForm} />
        </RouteListener>
      </Switch>
    </HashRouter>
  );
}
