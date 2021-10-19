import React, { useEffect } from 'react';
import Store from 'electron-store';
import { ConnectionData } from '../../shared/constants';

const ManageConnections = (): JSX.Element => {
  useEffect(() => {
    const store = new Store({ name: 'connections' });
    const data = store.get('connections') as Record<
      ConnectionData['channelID'],
      ConnectionData
    >;
    console.log(data);
  }, []);

  return <div>Manage Connections</div>;
};
export default ManageConnections;
