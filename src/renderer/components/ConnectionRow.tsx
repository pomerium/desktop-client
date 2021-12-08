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
import { clipboard, ipcRenderer } from 'electron';
import { Link } from 'react-router-dom';
import {
  CONNECT,
  DELETE,
  DISCONNECT,
  DUPLICATE,
  EDIT,
  EXPORT,
  ExportFile,
  SAVE_RECORD,
  UPDATE_LISTENERS,
  VIEW,
} from '../../shared/constants';
import Connected from '../icons/Connected';
import Disconnected from '../icons/Disconnected';
import {
  ListenerUpdateRequest,
  Selector,
  Record as ListenerRecord,
  Connection,
} from '../../shared/pb/api';

type ConnectionRowProps = {
  folderName: string;
  connection: ListenerRecord;
  connected: boolean;
  port: string;
};

const ConnectionRow: React.FC<ConnectionRowProps> = ({
  folderName,
  connection,
  connected,
  port,
}: ConnectionRowProps): JSX.Element => {
  const [menuAnchor, setMenuAnchor] = React.useState(null);

  const toggleMenu = (e) => {
    setMenuAnchor(e.currentTarget);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleMenuClick = (action: string) => {
    setMenuAnchor(null);
    switch (action) {
      case EXPORT:
        ipcRenderer.send(EXPORT, {
          filename: connection?.conn?.name || '',
          selector: {
            all: false,
            ids: [connection?.id || ''],
            tags: [],
          } as Selector,
        } as ExportFile);
        break;
      case DUPLICATE:
        // eslint-disable-next-line no-case-declarations
        const dupe: {
          conn?: Connection | undefined;
          id?: string | undefined;
          tags: string[];
        } = { ...connection };
        delete dupe.id;
        ipcRenderer.send(SAVE_RECORD, dupe);
        break;
      case 'copy_port':
        // eslint-disable-next-line no-case-declarations
        const parsed = port?.match(/\d+(?![^:]*:)/g);
        clipboard.writeText(parsed?.length ? parsed[0] : '');
        break;
      default:
        ipcRenderer.send(action, connection?.id || '');
    }
  };

  const toggleConnected = () => {
    ipcRenderer.send(UPDATE_LISTENERS, {
      connectionIds: [connection?.id || ''],
      connected: !connected,
    } as ListenerUpdateRequest);
  };

  return (
    <Grid container>
      <Grid container item xs={12} alignItems="center">
        <Grid container item xs={1} justifyContent="flex-end">
          <IconButton
            key={'menuButton' + folderName}
            aria-label={
              'toggle connected for ' + folderName + ' ' + connection?.id || ''
            }
            component="span"
            onClick={toggleConnected}
          >
            {connected ? <Connected /> : <Disconnected />}
          </IconButton>
        </Grid>
        <Grid item xs={3}>
          <Typography variant="h6">
            {capitalize(connection?.conn?.name || '')}
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Link to={'/view_connection/' + connection?.id || ''} />
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
              'Menu for connection: ' +
                folderName +
                '-' +
                connection?.conn?.name || ''
            }
          >
            <MoreVertical />
          </IconButton>
          <Menu
            id={'connection-menu' + folderName + connection?.id || ''}
            anchorEl={menuAnchor}
            keepMounted
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
          >
            {!connected && (
              <MenuItem key={CONNECT} onClick={toggleConnected}>
                Connect
              </MenuItem>
            )}
            {connected && (
              <MenuItem key={DISCONNECT} onClick={toggleConnected}>
                Disconnect
              </MenuItem>
            )}
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
            {connected && (
              <MenuItem
                key="copy_port"
                onClick={() => handleMenuClick('copy_port')}
              >
                Copy Port
              </MenuItem>
            )}
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
