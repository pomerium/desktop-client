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
import { ChevronDown } from 'react-feather';
import Card from '../components/Card';
import { Theme } from '../../shared/theme';
import Connections from '../../shared/connections';
import {
  CONNECT,
  ConnectionData,
  DELETE,
  DISCONNECT,
  EDIT,
  QueryParams,
  VIEW_CONNECTION_LIST,
} from '../../shared/constants';
import Connected from '../icons/Connected';
import Disconnected from '../icons/Disconnected';
import Edit from '../icons/Edit';
import Export from '../icons/Export';
import Delete from '../icons/Delete';

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
}));

const ConnectionView = (): JSX.Element => {
  const classes = useStyles();
  const [connection, setConnection] = useState({} as ConnectionData);
  const [connected, setConnected] = React.useState(Math.random() < 0.5);
  const { connectionID }: QueryParams = useParams();

  const fetchData = (): void => {
    const connHandler = new Connections();
    setConnection(connHandler.getConnection(connectionID));
  };

  const toggleConnected = () => {
    if (connected) {
      ipcRenderer.send(DISCONNECT, connection);
    } else {
      ipcRenderer.send(CONNECT, connection);
    }
    setConnected(!connected);
  };

  const deleteAndRedirect = () => {
    ipcRenderer.send(DELETE, connection);
    ipcRenderer.send(VIEW_CONNECTION_LIST);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
                  onClick={() => ipcRenderer.send(EDIT, connection)}
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
                  onClick={() => alert('export')}
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
                  {connection.destinationUrl}
                </Typography>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid container item xs={12} alignItems="center">
              <Grid item xs={4}>
                <Typography variant="h6">Local Address</Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="subtitle2">
                  {connection.localAddress}
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
                  {connection?.tags?.join(', ')}
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
                  <Typography variant="h6">Disable TLS Verification</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="subtitle2">
                    {connection.disableTLS ? 'Yes' : 'No'}
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
                  <Typography variant="h6">CA File</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="subtitle2">
                    {connection?.caFileText || ''}
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
              <div> logs </div>
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