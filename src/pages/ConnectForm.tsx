import {
  makeStyles,
  Button,
  Grid,
  TextField,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  ListItem,
  List,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';
import React, { FC, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isUrl, isIp } from '../utils/validators';
import {
  CONNECTION_CLOSED,
  CONNECTION_RESPONSE,
  DISCONNECT,
} from '../utils/constants';
import { TcpConnectArgs } from '../utils/binaries';

const useStyles = makeStyles(() => ({
  container: {
    padding: 3,
  },
  red: {
    color: 'red',
  },
  green: {
    color: 'green',
  },
  button: {
    padding: 1,
  },
  buttonWrapper: {
    marginTop: 20,
  },
}));

interface Props {
  onComplete?: () => void;
}

const ConnectForm: FC<Props> = () => {
  const classes = useStyles();
  const [disableTLS, setDisableTLS] = useState(false);
  const [localAddress, setLocalAddress] = useState('');
  const [localError, setLocalError] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState('');
  const [destinationError, setDestinationError] = useState(true);
  const [pomeriumUrl, setPomeriumUrl] = useState('');
  const [pomeriumUrlError, setPomeriumUrlError] = useState(false);
  const [connected, setConnected] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [channelID, setChannelID] = useState(''); // keeps communication per connection
  const handleSubmit = (evt: React.FormEvent): void => {
    evt.preventDefault();
  };

  const saveDestination = (value: string): void => {
    setDestinationUrl(value);
    setDestinationError(!isUrl(value) || !value.trim());
  };

  const saveLocal = (value: string): void => {
    setLocalAddress(value);
    setLocalError(!isIp(value));
  };

  const savePomeriumUrl = (value: string): void => {
    setPomeriumUrl(value);
    setPomeriumUrlError(!isUrl(value));
  };

  const disconnect = (channel_id: string): void => {
    ipcRenderer.send(DISCONNECT, { channelID: channel_id });
  };

  useEffect(() => {
    ipcRenderer.on(CONNECTION_RESPONSE, (_, msg) => {
      if (msg.channelID === channelID) {
        setOutput(msg.output);
      }
    });
    ipcRenderer.on(CONNECTION_CLOSED, (_, msg) => {
      if (msg.channelID === channelID) {
        setConnected(false);
      }
    });
  }, [channelID]);

  const connect = (): void => {
    if (!localError && !destinationError && !pomeriumUrlError) {
      const uuid = uuidv4();
      setChannelID(uuid);
      ipcRenderer.removeAllListeners(CONNECTION_RESPONSE);
      ipcRenderer.removeAllListeners(CONNECTION_CLOSED);
      setOutput([]);
      setConnected(true);
      const args: TcpConnectArgs = {
        destinationUrl,
        localAddress,
        pomeriumUrl,
        disableTLS,
        channelID: uuid,
      };

      ipcRenderer.send('connect', args);
    }
  };

  const clear = (): void => {
    setDisableTLS(false);
    setLocalAddress('');
    setLocalError(false);
    setDestinationUrl('');
    setDestinationError(true);
    setPomeriumUrl('');
    setPomeriumUrlError(false);
    setConnected(false);
    setOutput([]);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Grid className={classes.container}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <Typography variant="h4">Pomerium TCP Connector</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                error={destinationError}
                label="Destination Url"
                value={destinationUrl}
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
                    <Checkbox
                      checked={disableTLS}
                      name="disable-tls-verification"
                      color="primary"
                      onChange={(): void => setDisableTLS(!disableTLS)}
                    />
                  }
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Local Address"
                error={localError}
                value={localAddress}
                onChange={(evt): void => saveLocal(evt.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Alternate Pomerium Url"
                error={pomeriumUrlError}
                value={pomeriumUrl}
                onChange={(evt): void => savePomeriumUrl(evt.target.value)}
                variant="outlined"
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
                  variant="outlined"
                  onClick={() => disconnect(channelID)}
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
                  variant="outlined"
                  disabled={
                    localError ||
                    destinationError ||
                    pomeriumUrlError ||
                    connected
                  }
                  color="primary"
                  className={classes.button}
                  onClick={connect}
                >
                  Connect
                </Button>
              </Grid>
              <Grid item xs={3}>
                <Button
                  fullWidth
                  type="button"
                  variant="outlined"
                  onClick={clear}
                  color="primary"
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
