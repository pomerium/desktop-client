import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { useParams } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { AlertTriangle, ChevronDown, Info } from 'react-feather';
import { useSnackbar } from 'notistack';
import Card from '../components/Card';
import { Theme } from '../../shared/theme';
import {
  DELETE,
  EDIT,
  ExportFile,
  GET_RECORDS,
  LISTENER_LOG,
  LISTENER_STATUS,
  QueryParams,
  TOAST_LENGTH,
  UPDATE_LISTENERS,
  VIEW_CONNECTION_LIST,
} from '../../shared/constants';
import Connected from '../icons/Connected';
import Disconnected from '../icons/Disconnected';
import Edit from '../icons/Edit';
import Export from '../icons/Export';
import Delete from '../icons/Delete';
import {
  Connection,
  ConnectionStatusUpdate,
  ListenerUpdateRequest,
  Record,
  Selector,
} from '../../shared/pb/api';
import ExportJSON from '../icons/ExportJSON';
import CertDetails from '../components/CertDetails';
import ExportDialog from '../components/ExportDialog';

const useStyles = makeStyles((theme: Theme) => ({
  titleGrid: {
    paddingTop: theme.spacing(4),
  },
  accordion: {
    backgroundColor: theme.palette.background.paper,
    marginTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    borderRadius: '16px',
    '&:before': {
      display: 'none',
    },
  },
  logGrid: {
    borderTop: '1px solid #E3E3E3',
  },
}));

type SimplifiedLog = {
  status: 'info' | 'error';
  message: string;
  date: string;
};

const ConnectionView = (): JSX.Element => {
  const classes = useStyles();
  const [tags, setTags] = useState([] as Record['tags']);
  const [connection, setConnection] = useState({} as Connection);
  const [connected, setConnected] = useState(false);
  const [errorFilter, setErrorFilter] = useState(false);
  const [infoFilter, setInfoFilter] = useState(false);
  const [connectionPort, setConnectionPort] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([] as SimplifiedLog[]);
  const [logs, setLogs] = useState([] as SimplifiedLog[]);
  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [exportFile, setExportFile] = useState<ExportFile | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { connectionID }: QueryParams = useParams();

  const toggleMenu = (e) => {
    setMenuAnchor(e.currentTarget);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const toggleConnected = () => {
    ipcRenderer.send(UPDATE_LISTENERS, {
      connectionIds: [connectionID],
      connected: !connected,
    } as ListenerUpdateRequest);
  };

  const deleteAndRedirect = () => {
    ipcRenderer.send(DELETE, connectionID);
    ipcRenderer.send(VIEW_CONNECTION_LIST);
  };

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(filteredLogs)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'logs.json';
    link.click();
  };

  const formatLog = (msg: ConnectionStatusUpdate): SimplifiedLog => {
    const date = msg.ts?.toLocaleTimeString() || '';
    const status = msg.lastError ? 'error' : 'info';
    let message = '';

    switch (msg.status) {
      case 1:
        message = 'Connecting to Pomerium...';
        break;
      case 2:
        message = `Authentication required, web browser was open`;
        break;
      case 3:
        message = 'Connected to Pomerium';
        break;
      case 4:
        message = 'Disconnected from Pomerium';
        break;
      case 5:
        message = 'Listening for new connections';
        break;
      case 6:
        message = 'Stop listening for new connections';
        break;
      default:
        break;
    }

    if (msg.lastError) {
      message += ': ' + msg.lastError;
    }

    return { message, status, date };
  };

  useEffect(() => {
    ipcRenderer.on(LISTENER_STATUS, (_, args) => {
      if (args.err) {
        enqueueSnackbar(args.err.message, {
          variant: 'error',
          autoHideDuration: TOAST_LENGTH,
        });
      } else {
        setConnected(!!args?.res?.listeners[connectionID]?.listening);
        const listenAddr = args?.res?.listeners[connectionID]?.listenAddr;
        setConnectionPort(listenAddr || '');
        if (args?.res?.listeners[connectionID]?.lastError) {
          enqueueSnackbar(args?.res?.listeners[connectionID]?.lastError, {
            variant: 'error',
            autoHideDuration: TOAST_LENGTH,
          });
        }
      }
    });
    ipcRenderer.on(LISTENER_LOG, (_, args) => {
      setLogs((oldLogs) => [formatLog(args.msg), ...oldLogs]);
    });
    if (connectionID) {
      ipcRenderer.once(GET_RECORDS, (_, args) => {
        if (args?.res?.records?.length === 1) {
          setTags(args.res.records[0].tags || []);
          setConnection(args.res.records[0].conn);
          ipcRenderer.send(LISTENER_LOG, {
            id: connectionID,
            remoteAddr: args.res.records[0].conn.remoteAddr,
          });
        }
      });
      ipcRenderer.send(GET_RECORDS, {
        all: false,
        ids: [connectionID],
        tags: [],
      } as Selector);
      ipcRenderer.send(LISTENER_STATUS, {
        all: false,
        ids: [connectionID],
        tags: [],
      } as Selector);
    }
    return function cleanup() {
      ipcRenderer.removeAllListeners(GET_RECORDS);
      ipcRenderer.removeAllListeners(LISTENER_STATUS);
      ipcRenderer.removeAllListeners(LISTENER_LOG);
    };
  }, [connectionID]);

  useEffect(() => {
    if ((errorFilter && infoFilter) || (!errorFilter && !infoFilter)) {
      setFilteredLogs(logs);
    } else if (errorFilter) {
      setFilteredLogs(logs.filter((log) => log.status === 'error'));
    } else {
      setFilteredLogs(logs.filter((log) => log.status === 'info'));
    }
  }, [logs, errorFilter, infoFilter]);

  if (Object.keys(connection).length) {
    return (
      <>
        <ExportDialog
          exportFile={exportFile}
          onClose={() => setExportFile(null)}
        />
        <Container maxWidth={false}>
          <Grid className={classes.titleGrid}>
            <Grid container alignItems="flex-start">
              <Grid item xs={5}>
                <Typography variant="h3" color="textPrimary">
                  {connection.name}
                </Typography>
              </Grid>
              <Grid item xs={7} container justifyContent="flex-end">
                <Grid item>
                  <Button
                    size="small"
                    type="button"
                    color="primary"
                    onClick={() => ipcRenderer.send(EDIT, connectionID)}
                    endIcon={<Edit />}
                  >
                    Edit
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    size="small"
                    type="button"
                    color="primary"
                    onClick={() =>
                      setExportFile({
                        filename: connection?.name || 'download',
                        selector: {
                          all: false,
                          ids: [connectionID],
                          tags: [],
                        },
                      })
                    }
                    endIcon={<Export />}
                  >
                    Export
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    size="small"
                    type="button"
                    color="primary"
                    onClick={deleteAndRedirect}
                    endIcon={<Delete />}
                  >
                    Delete
                  </Button>
                </Grid>
                <Grid item>
                  {connected && (
                    <Button
                      size="small"
                      type="button"
                      color="primary"
                      onClick={() => toggleConnected()}
                      endIcon={<Disconnected />}
                    >
                      Disconnect
                    </Button>
                  )}
                  {!connected && (
                    <Button
                      size="small"
                      type="button"
                      color="primary"
                      onClick={() => toggleConnected()}
                      endIcon={<Connected />}
                    >
                      Connect
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Card>
            <Grid container spacing={2}>
              <Grid container item xs={12} alignItems="center">
                <Grid item xs={4}>
                  <Typography variant="h6">Destination URL</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="subtitle2">
                    {connection.remoteAddr}
                  </Typography>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid container item xs={12} alignItems="center">
                <Grid item xs={4}>
                  <Typography variant="h6">Listener Address</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="subtitle2">
                    {connectionPort || connection.listenAddr}
                  </Typography>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid container item xs={12} alignItems="center">
                <Grid item xs={4}>
                  <Typography variant="h6">Tags</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="subtitle2">
                    {tags?.join(', ')}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Card>

          <Accordion className={classes.accordion} square={false}>
            <AccordionSummary
              expandIcon={<ChevronDown />}
              aria-controls="advanced-settings-content"
              id="advanced-settings-header"
            >
              <Typography variant="h5">Advanced Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid container item xs={12} alignItems="center">
                  <Grid item xs={4}>
                    <Typography variant="h6">
                      Disable TLS Verification
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="subtitle2">
                      {connection.disableTlsVerification ? 'Yes' : 'No'}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                <Grid container item xs={12} alignItems="center">
                  <Grid item xs={4}>
                    <Typography variant="h6">Pomerium URL</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="subtitle2">
                      {connection.pomeriumUrl}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                <Grid container item xs={12} alignItems="center">
                  <Grid item xs={4}>
                    <Typography variant="h6">Client Certificate</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    {connection?.clientCert?.info && (
                      <>
                        <CertDetails
                          open={showDetail}
                          onClose={() => setShowDetail(false)}
                          certInfo={connection?.clientCert?.info}
                        />
                        <Chip
                          label="Details"
                          color="primary"
                          onClick={() => setShowDetail(true)}
                        />
                      </>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          <Accordion className={classes.accordion} square={false}>
            <AccordionSummary
              expandIcon={<ChevronDown />}
              aria-controls="log-content"
              id="log-header"
            >
              <Grid container item alignItems="center">
                <Grid item xs={9}>
                  <Typography variant="h5">Logs</Typography>
                </Grid>
                {!!logs?.length && (
                  <Grid item xs={3}>
                    <Button
                      size="small"
                      type="button"
                      color="primary"
                      disabled={!filteredLogs?.length}
                      onClick={(e) => {
                        e.stopPropagation();
                        exportLogs();
                      }}
                    >
                      Export Logs
                    </Button>
                    <IconButton
                      aria-controls="filter-menu"
                      aria-haspopup="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(e);
                      }}
                      aria-label="Menu for filters/export"
                      size="large"
                    >
                      <ExportJSON />
                    </IconButton>
                    <Menu
                      id="filter-menu"
                      anchorEl={menuAnchor}
                      keepMounted
                      open={Boolean(menuAnchor)}
                      onClose={handleMenuClose}
                    >
                      <MenuItem
                        key="errorFilter"
                        onClick={(e) => {
                          e.stopPropagation();
                          setErrorFilter(!errorFilter);
                        }}
                      >
                        <Checkbox
                          color="primary"
                          checked={errorFilter}
                          onChange={(e) => {
                            e.stopPropagation();
                            setErrorFilter(!errorFilter);
                          }}
                          value={errorFilter}
                        />
                        Error
                      </MenuItem>
                      <MenuItem
                        key="infoFilter"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoFilter(!infoFilter);
                        }}
                      >
                        <Checkbox
                          color="primary"
                          checked={infoFilter}
                          onChange={(e) => {
                            e.stopPropagation();
                            setInfoFilter(!infoFilter);
                          }}
                          value={infoFilter}
                        />
                        Info
                      </MenuItem>
                      <MenuItem key="exportToJSON">
                        <Button
                          size="small"
                          type="button"
                          color="primary"
                          variant="contained"
                          disabled={!filteredLogs?.length}
                          onClick={(e) => {
                            e.stopPropagation();
                            exportLogs();
                          }}
                        >
                          Export Logs
                        </Button>
                      </MenuItem>
                    </Menu>
                  </Grid>
                )}
              </Grid>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {filteredLogs.map((log) => (
                  <Grid
                    item
                    container
                    alignItems="center"
                    key={Math.random()}
                    className={classes.logGrid}
                  >
                    <Grid item xs={2}>
                      {log.status === 'info' && (
                        <Info style={{ color: 'blue' }} />
                      )}
                      {log.status === 'error' && (
                        <AlertTriangle style={{ color: 'orange' }} />
                      )}
                    </Grid>
                    <Grid item xs={4}>
                      <Typography>{log.date}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography style={{ wordWrap: 'break-word' }}>
                        {log.message}
                      </Typography>
                    </Grid>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
          <Box minHeight="20px" />
        </Container>
      </>
    );
  }
  return <></>;
};
export default ConnectionView;
