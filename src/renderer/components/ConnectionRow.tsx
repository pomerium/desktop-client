import {
  Typography,
  Grid,
  IconButton,
  Divider,
  MenuItem,
  Menu,
  Tooltip,
  Box,
} from '@mui/material';
import { clipboard, ipcRenderer } from 'electron';
import { useSnackbar } from 'notistack';
import React, { ReactElement } from 'react';
import { Copy, MoreVertical } from 'react-feather';
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
  TOAST_LENGTH,
  UPDATE_LISTENERS,
  VIEW,
} from '../../shared/constants';
import {
  ListenerUpdateRequest,
  Record as ListenerRecord,
  Connection,
} from '../../shared/pb/api';
import Connected from '../icons/Connected';
import Disconnected from '../icons/Disconnected';
import ExportDialog from './ExportDialog';

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
}: ConnectionRowProps): ReactElement => {
  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [exportFile, setExportFile] = React.useState<ExportFile | null>(null);
  const { enqueueSnackbar } = useSnackbar();

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
        setExportFile({
          filename: connection?.conn?.name || '',
          selector: {
            all: false,
            ids: [connection?.id || ''],
            tags: [],
          },
        });
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
        enqueueSnackbar('Port Copied', {
          variant: 'success',
          autoHideDuration: TOAST_LENGTH,
        });
        break;
      default:
        ipcRenderer.send(action, connection?.id || '');
    }
  };

  const copyAddress = () => {
    setMenuAnchor(null);
    clipboard.writeText(port);
    enqueueSnackbar('Address Copied', {
      variant: 'success',
      autoHideDuration: TOAST_LENGTH,
    });
  };

  const toggleConnected = () => {
    setMenuAnchor(null);
    ipcRenderer.send(UPDATE_LISTENERS, {
      connectionIds: [connection?.id || ''],
      connected: !connected,
    } as ListenerUpdateRequest);
  };

  return (
    <>
      <ExportDialog
        exportFile={exportFile}
        onClose={() => setExportFile(null)}
      />
      <Grid container>
        <Grid container item xs={12} alignItems="center">
          <Grid container item xs={1} justifyContent="flex-end">
            <IconButton
              key={'menuButton' + folderName}
              aria-label={
                'toggle listeners for ' + folderName + ' ' + connection?.id ||
                ''
              }
              component="span"
              onClick={toggleConnected}
              size="large"
            >
              {connected ? <Connected /> : <Disconnected />}
            </IconButton>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="h6">{connection?.conn?.name || ''}</Typography>
          </Grid>
          <Grid item xs={4}>
            <Link to={'/view_connection/' + connection?.id || ''} />
          </Grid>
          <Grid
            container
            item
            xs={3}
            justifyContent="flex-end"
            alignItems="center"
          >
            {connected && (
              <>
                <Tooltip title="Copy to Clipboard">
                  <Typography
                    variant="subtitle2"
                    onClick={copyAddress}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        color: '#6E43E8',
                      },
                    }}
                  >
                    {'Listening on ' + port}
                  </Typography>
                </Tooltip>
                <Tooltip title="Copy to Clipboard">
                  <Box
                    sx={{
                      padding: 0,
                      margin: 0,
                      marginLeft: '5px',
                      cursor: 'pointer',
                      '&:hover': {
                        color: '#6E43E8',
                      },
                    }}
                  >
                    <Copy size="14" onClick={copyAddress} />
                  </Box>
                </Tooltip>
              </>
            )}
            {!connected && (
              <Typography variant="subtitle2">Inactive</Typography>
            )}
          </Grid>
          <Grid container item xs={1} justifyContent="center">
            <IconButton
              aria-controls="connection-menu"
              aria-haspopup="true"
              onClick={toggleMenu}
              aria-label={
                'Menu for listener: ' +
                  folderName +
                  '-' +
                  connection?.conn?.name || ''
              }
              size="large"
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
    </>
  );
};

export default ConnectionRow;
