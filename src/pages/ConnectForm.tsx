import {
  makeStyles,
  Button,
  Grid,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  ListItem,
  List,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';
import React, { FC, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router-dom';
import Store from 'electron-store';
import { isUrl, isIp } from '../utils/validators';
import {
  CONNECTION_CLOSED,
  CONNECTION_RESPONSE,
  DISCONNECT,
  ConnectionData,
} from '../utils/constants';
import TextField from '../components/TextField';
import { Theme } from '../utils/theme';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    padding: theme.spacing(3),
  },
  red: {
    color: 'red',
  },
  green: {
    color: 'green',
  },
  button: {
    background: theme.palette.primary.light,
    marginRight: theme.spacing(1),
    '&:hover': {
      background: theme.palette.primary.light,
      opacity: `0.6`,
    },
  },
  buttonWrapper: {
    marginTop: 20,
  },
}));

interface Props {
  onComplete?: () => void;
}

const noErrors = {
  localAddress: false,
  destinationUrl: false,
  pomeriumUrl: false,
  caFilePath: false,
  caFileText: false,
};

const initialConnectionData: ConnectionData = {
  destinationUrl: '',
  localAddress: '',
  pomeriumUrl: '',
  disableTLS: false,
  caFileText: '',
  caFilePath: '',
  channelID: '',
};

interface QueryParams {
  channelId: string;
  editingConnected: string;
}

const ConnectForm: FC<Props> = () => {
  const classes = useStyles();
  const [connected, setConnected] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [errors, setErrors] = useState(noErrors);
  const [connectionData, setConnectionData] = useState(initialConnectionData);
  const handleSubmit = (evt: React.FormEvent): void => {
    evt.preventDefault();
  };

  const { channelId, editingConnected }: QueryParams = useParams();
  useEffect(() => {
    if (channelId) {
      const store = new Store({ name: 'connections' });
      const data = store.get('connections') as Record<
        ConnectionData['channelID'],
        ConnectionData
      >;
      if (data[channelId]) {
        setConnectionData(data[channelId]);
      }
      setConnected(editingConnected === 'true');
    }
  }, [channelId]);

  const saveDestination = (value: string): void => {
    setConnectionData({
      ...connectionData,
      ...{ destinationUrl: value.trim() },
    });
    setErrors({
      ...errors,
      ...{ destinationUrl: !isUrl(value) || !value.trim() },
    });
  };

  const saveLocal = (value: string): void => {
    setConnectionData({ ...connectionData, ...{ localAddress: value.trim() } });
    setErrors({
      ...errors,
      ...{ localAddress: !isIp(value) },
    });
  };

  const savePomeriumUrl = (value: string): void => {
    setConnectionData({ ...connectionData, ...{ pomeriumUrl: value.trim() } });
    setErrors({
      ...errors,
      ...{ pomeriumUrl: !isUrl(value) },
    });
  };

  const saveDisableTLS = (): void => {
    setConnectionData({
      ...connectionData,
      ...{ disableTLS: !connectionData.disableTLS },
    });
  };

  const saveCaFilePath = (value: string): void => {
    setConnectionData({ ...connectionData, ...{ caFilePath: value.trim() } });
    setErrors({
      ...errors,
      ...{ caFilePath: !!connectionData.caFileText },
    });
  };

  const saveCaFileText = (value: string): void => {
    setConnectionData({ ...connectionData, ...{ caFileText: value.trim() } });
    setErrors({
      ...errors,
      ...{ caFileText: !!connectionData.caFilePath },
    });
  };

  const disconnect = (channel_id: string): void => {
    ipcRenderer.send(DISCONNECT, { channelID: channel_id });
  };

  useEffect(() => {
    ipcRenderer.removeAllListeners(CONNECTION_RESPONSE);
    ipcRenderer.removeAllListeners(CONNECTION_CLOSED);
    ipcRenderer.on(CONNECTION_RESPONSE, (_, msg) => {
      if (msg.channelID === connectionData.channelID) {
        setOutput(msg.output);
      }
    });
    ipcRenderer.on(CONNECTION_CLOSED, (_, msg) => {
      if (msg.channelID === connectionData.channelID) {
        setConnected(false);
      }
    });
  }, [connectionData.channelID]);

  const connect = (): void => {
    if (Object.values(errors).every((error) => !error)) {
      setOutput([]);
      setConnected(true);
      const args: ConnectionData = { ...connectionData };
      if (!args.channelID) {
        const uuid = uuidv4();
        args.channelID = uuid;
      }
      setConnectionData(args);
      ipcRenderer.send('connect', args);
    }
  };

  const clear = (): void => {
    setConnectionData(initialConnectionData);
    setConnected(false);
    setOutput([]);
    setErrors(noErrors);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Grid className={classes.container}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <Typography variant="h3" color="textPrimary">
                Pomerium TCP Connector
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                error={errors.destinationUrl}
                label="Destination Url"
                value={connectionData.destinationUrl}
                onChange={(evt): void => saveDestination(evt.target.value)}
                variant="outlined"
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  label="Disable TLS Verification"
                  control={
                    <Switch
                      checked={connectionData.disableTLS}
                      name="disable-tls-verification"
                      color="primary"
                      onChange={saveDisableTLS}
                    />
                  }
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Local Address"
                error={errors.localAddress}
                value={connectionData.localAddress}
                onChange={(evt): void => saveLocal(evt.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Alternate Pomerium Url"
                error={errors.pomeriumUrl}
                value={connectionData.pomeriumUrl}
                onChange={(evt): void => savePomeriumUrl(evt.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="CA File Path"
                error={errors.caFilePath}
                value={connectionData.caFilePath}
                onChange={(evt): void => saveCaFilePath(evt.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="CA File Text"
                error={errors.caFileText}
                value={connectionData.caFileText}
                onChange={(evt): void => saveCaFileText(evt.target.value)}
                variant="outlined"
                multiline
                rows={4}
              />
            </Grid>
            <Grid
              container
              spacing={8}
              alignItems="center"
              justify="center"
              className={classes.buttonWrapper}
            >
              <Grid item xs={3}>
                <Button
                  fullWidth
                  type="button"
                  variant="contained"
                  onClick={() => disconnect(connectionData.channelID)}
                  disabled={!connected}
                  color="primary"
                  className={classes.button}
                >
                  Disconnect
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button
                  fullWidth
                  type="button"
                  variant="contained"
                  disabled={Object.values(errors).some(Boolean)}
                  color="primary"
                  className={classes.button}
                  onClick={connect}
                >
                  Save/Connect
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  type="button"
                  onClick={clear}
                  className={classes.button}
                  disabled={!connected}
                >
                  New Connection
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </form>
      {!!output.length && (
        <Grid container alignItems="center" justify="center">
          <List>
            {output.map((item, i) => (
              <ListItem
                className={connected ? classes.green : classes.red}
                // eslint-disable-next-line react/no-array-index-key
                key={`output_${i}`}
              >
                {item}
              </ListItem>
            ))}
          </List>
        </Grid>
      )}
    </>
  );
};

export default ConnectForm;
