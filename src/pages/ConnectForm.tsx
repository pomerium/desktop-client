import {
  Button,
  Container,
  Grid,
  List,
  ListItem,
  makeStyles,
  Switch,
  Typography,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';
import React, { FC, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router-dom';
import Store from 'electron-store';
import { isIp } from '../utils/validators';
import {
  CONNECTION_CLOSED,
  CONNECTION_RESPONSE,
  ConnectionData,
  DISCONNECT,
} from '../utils/constants';
import TextField from '../components/TextField';
import FieldWrapper from '../components/FieldWrapper';
import { Theme } from '../utils/theme';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    padding: theme.spacing(2),
  },
  red: {
    color: 'red',
  },
  green: {
    color: 'green',
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
  }, [channelId, editingConnected]);

  const saveDestination = (value: string): void => {
    setConnectionData({
      ...connectionData,
      ...{ destinationUrl: value.trim() },
    });
    setErrors({
      ...errors,
      ...{ destinationUrl: !value.trim() },
    });
  };

  const saveLocal = (value: string): void => {
    setConnectionData({ ...connectionData, ...{ localAddress: value.trim() } });
    setErrors({
      ...errors,
      ...{ localAddress: !isIp(value) && !!value },
    });
  };

  const savePomeriumUrl = (value: string): void => {
    setConnectionData({ ...connectionData, ...{ pomeriumUrl: value.trim() } });
  };

  const saveDisableTLS = (): void => {
    setConnectionData({
      ...connectionData,
      ...{ disableTLS: !connectionData.disableTLS },
    });
  };

  const saveCaFilePath = (value: string): void => {
    setConnectionData({ ...connectionData, ...{ caFilePath: value.trim() } });
  };

  const saveCaFileText = (value: string): void => {
    setConnectionData({ ...connectionData, ...{ caFileText: value.trim() } });
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
        args.channelID = uuidv4();
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
    <Container>
      <form onSubmit={handleSubmit}>
        <Grid className={classes.container}>
          <Grid container alignItems="flex-start">
            <Grid item xs={12}>
              <Typography variant="h3" color="textPrimary">
                {connectionData.channelID ? 'Edit' : 'Add'} TCP Connection
              </Typography>
            </Grid>
          </Grid>
        </Grid>

        <FieldWrapper
          description="REQUIRED. The url to connect to. The FROM field in a pomerium route."
          label="Destination Url"
        >
          <TextField
            fullWidth
            required
            value={connectionData.destinationUrl}
            onChange={(evt): void => saveDestination(evt.target.value)}
            variant="outlined"
            autoFocus
          />
        </FieldWrapper>

        <FieldWrapper
          description="Skips TLS verification. No Cert Authority Needed."
          label="Disable TLS Verification"
        >
          <Switch
            checked={connectionData.disableTLS}
            name="disable-tls-verification"
            color="primary"
            onChange={saveDisableTLS}
          />
        </FieldWrapper>

        <FieldWrapper
          description="OPTIONAL. The port or local address you want to connect to. Ex. :8888 or 127.0.0.1:8888"
          label="Local Address"
        >
          <TextField
            fullWidth
            error={errors.localAddress}
            value={connectionData.localAddress}
            onChange={(evt): void => saveLocal(evt.target.value)}
            variant="outlined"
          />
        </FieldWrapper>

        <FieldWrapper
          description={
            "OPTIONAL. Pomerium Proxy Url. Useful if the Destination URL isn't publicly resolvable"
          }
          label="Alternate Pomerium Url"
        >
          <TextField
            fullWidth
            error={errors.pomeriumUrl}
            value={connectionData.pomeriumUrl}
            onChange={(evt): void => savePomeriumUrl(evt.target.value)}
            variant="outlined"
          />
        </FieldWrapper>

        <FieldWrapper
          label="CA File Path"
          description="OPTIONAL. If Pomerium is using a CA in your system's trusted keychain you can provide the path to it here."
        >
          <TextField
            fullWidth
            error={errors.caFilePath}
            value={connectionData.caFilePath}
            onChange={(evt): void => saveCaFilePath(evt.target.value)}
            variant="outlined"
          />
        </FieldWrapper>

        <FieldWrapper
          label="CA File Text"
          description="OPTIONAL. If Pomerium is using a CA in your system's trusted keychain you can copy/paste it here."
        >
          <TextField
            fullWidth
            error={errors.caFileText}
            value={connectionData.caFileText}
            onChange={(evt): void => saveCaFileText(evt.target.value)}
            variant="outlined"
            multiline
            rows={4}
          />
        </FieldWrapper>
        <Grid
          container
          spacing={4}
          alignItems="center"
          justifyContent="center"
          className={classes.buttonWrapper}
        >
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              type="button"
              variant="contained"
              onClick={() => disconnect(connectionData.channelID)}
              disabled={!connected}
              color="primary"
            >
              Disconnect
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              type="button"
              variant="contained"
              disabled={Object.values(errors).some(Boolean)}
              color="primary"
              onClick={connect}
            >
              Save/Connect
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="button"
              onClick={clear}
              disabled={!connected}
            >
              New Connection
            </Button>
          </Grid>
        </Grid>
      </form>
      {!!output.length && (
        <Grid container alignItems="center" justifyContent="center">
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
    </Container>
  );
};

export default ConnectForm;
