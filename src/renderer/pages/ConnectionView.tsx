import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  makeStyles,
  Typography,
} from '@material-ui/core';
import { useParams } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { AlertTriangle, ChevronDown, Info } from 'react-feather';
import Card from '../components/Card';
import { Theme } from '../../shared/theme';
import {
  DELETE,
  EDIT,
  EXPORT,
  ExportFile,
  GET_RECORDS,
  LISTENER_STATUS,
  QueryParams,
  UPDATE_LISTENERS,
  VIEW_CONNECTION_LIST,
  LISTENER_LOG,
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
import Toast from '../components/Toast';

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
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState([] as SimplifiedLog[]);
  const { connectionID }: QueryParams = useParams();

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

  const formatLog = (
    msg: ConnectionStatusUpdate,
    remoteAddr: string
  ): SimplifiedLog => {
    const date = new Date().toISOString();
    const status = msg.lastError ? 'error' : 'info';
    let message = '';

    switch (msg.status) {
      case 1:
        message = msg.peerAddr + ' opening connection to ' + remoteAddr;
        break;
      case 2:
        message =
          msg.peerAddr +
          ' authentication with ' +
          msg.authUrl +
          ' required for ' +
          connection.remoteAddr;
        break;
      case 3:
        message = msg.peerAddr + ' connected to ' + remoteAddr;
        break;
      case 4:
        message = msg.peerAddr + ' disconnected from ' + remoteAddr;
        break;
      default:
        break;
    }

    if (msg.lastError) {
      message =
        msg.peerAddr +
        'failed to connect to ' +
        remoteAddr +
        ':' +
        msg.lastError;
    }

    return { message, status, date };
  };

  useEffect(() => {
    ipcRenderer.on(LISTENER_STATUS, (_, args) => {
      if (args.err) {
        setError(args.err.message);
      } else {
        setConnected(!!args?.res?.listeners[connectionID]?.listening);
        if (args?.res?.listeners[connectionID]?.lastError) {
          setError(args?.res?.listeners[connectionID]?.lastError);
        }
      }
    });
    ipcRenderer.on(LISTENER_LOG, (_, args) => {
      setLogs((oldLogs) => [...oldLogs, formatLog(args.msg, args.remoteAddr)]);
    });
    ipcRenderer.on(EXPORT, (_, args) => {
      if (args.err) {
        setError(args.err.message);
      } else {
        const blob = new Blob([args.data], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = args.filename.replace(/\s+/g, '_') + '.json';
        link.click();
      }
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
      ipcRenderer.removeAllListeners(EXPORT);
      ipcRenderer.removeAllListeners(LISTENER_LOG);
    };
  }, [connectionID]);

  if (Object.keys(connection).length) {
    return (
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
                    ipcRenderer.send(EXPORT, {
                      filename: connection?.name || 'download',
                      selector: {
                        all: false,
                        ids: [connectionID],
                        tags: [],
                      } as Selector,
                    } as ExportFile)
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

        {error && <Toast msg={error} alertType="error" />}

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
                  {connection.listenAddr}
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
                <Typography variant="subtitle2">{tags?.join(', ')}</Typography>
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
                  <Typography variant="h6">Disable TLS Verification</Typography>
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
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Accordion className={classes.accordion} square={false}>
          <AccordionSummary
            expandIcon={<ChevronDown />}
            aria-controls="log-content"
            id="log-header"
          >
            <Typography variant="h5">Logs</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {logs.map((log) => (
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
                    {log.date}
                  </Grid>
                  <Grid item xs={6}>
                    {log.message}
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
        <Box minHeight="20px" />
      </Container>
    );
  }
  return <></>;
};
export default ConnectionView;
