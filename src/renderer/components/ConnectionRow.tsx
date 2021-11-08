import * as React from 'react';
import {
  Typography,
  Grid,
  IconButton,
  Divider,
  MenuItem,
  Menu,
  capitalize,
} from '@material-ui/core';
import { MoreVertical } from 'react-feather';
import { ipcRenderer } from 'electron';
import { Link } from 'react-router-dom';
import {
  CONNECT,
  DELETE,
  DISCONNECT,
  DUPLICATE,
  EDIT,
  EXPORT,
  VIEW,
} from '../../shared/constants';
import Connected from '../icons/Connected';
import Disconnected from '../icons/Disconnected';

type ConnectionRowProps = {
  folderName: string;
  connectionName: string;
  connectionID: string;
};

const ConnectionRow: React.FC<ConnectionRowProps> = ({
  folderName,
  connectionName,
  connectionID,
}: ConnectionRowProps): JSX.Element => {
  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [connected, setConnected] = React.useState(Math.random() < 0.5);

  const toggleMenu = (e) => {
    setMenuAnchor(e.currentTarget);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleMenuClick = (action: string) => {
    setMenuAnchor(null);
    ipcRenderer.send(action, connectionID);
  };

  const toggleConnected = () => {
    if (connected) {
      ipcRenderer.send(DISCONNECT, connectionID);
    } else {
      ipcRenderer.send(CONNECT, connectionID);
    }
    setConnected(!connected);
  };

  return (
    <Grid container>
      <Grid container item xs={12} alignItems="center">
        <Grid container item xs={1} justifyContent="flex-end">
          <IconButton
            key={'menuButton' + folderName}
            aria-label={
              'toggle connected for ' + folderName + ' ' + connectionID
            }
            component="span"
            onClick={toggleConnected}
          >
            {connected ? <Connected /> : <Disconnected />}
          </IconButton>
        </Grid>
        <Grid item xs={3}>
          <Typography variant="h6">{capitalize(connectionName)}</Typography>
        </Grid>
        <Grid item xs={5}>
          <Link to={'/view_connection/' + connectionID} />
        </Grid>
        <Grid container item xs={2} justifyContent="flex-end">
          <Typography variant="subtitle2">
            {connected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Grid>
        <Grid container item xs={1} justifyContent="center">
          <IconButton
            aria-controls="connection-menu"
            aria-haspopup="true"
            onClick={toggleMenu}
            aria-label={
              'Menu for connection: ' + folderName + '-' + connectionName
            }
          >
            <MoreVertical />
          </IconButton>
          <Menu
            id={'connection-menu' + folderName + connectionID}
            anchorEl={menuAnchor}
            keepMounted
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
          >
            <MenuItem key={CONNECT} onClick={() => handleMenuClick(CONNECT)}>
              Connect
            </MenuItem>
            <MenuItem
              key={DISCONNECT}
              onClick={() => handleMenuClick(DISCONNECT)}
            >
              Disconnect
            </MenuItem>
            <MenuItem key="edit" onClick={() => handleMenuClick(EDIT)}>
              Edit
            </MenuItem>
            <MenuItem key="view" onClick={() => handleMenuClick(VIEW)}>
              View
            </MenuItem>
            <MenuItem
              key={DUPLICATE}
              onClick={() => handleMenuClick(DUPLICATE)}
            >
              Duplicate
            </MenuItem>
            <MenuItem key={EXPORT} onClick={() => handleMenuClick(EXPORT)}>
              Export
            </MenuItem>
            <MenuItem key={DELETE} onClick={() => handleMenuClick(DELETE)}>
              Delete
            </MenuItem>
          </Menu>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={12}>
          <Divider />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ConnectionRow;
