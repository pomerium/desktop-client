import {
  makeStyles,
  Container,
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
import React, { FC, useState } from 'react';
import { isUrl, isIp } from '../utils/validators';

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
  const [disconnectChannel, setDisconnectChannel] = useState('');
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

  const disconnect = (): void => {
    if (disconnectChannel) {
      ipcRenderer.send(disconnectChannel, null);
    }
  };

  const connect = (): void => {
    if (!localError && !destinationError && !pomeriumUrlError) {
      setOutput([]);
      setConnected(true);
      const args = {
        destinationUrl,
        localAddress,
        pomeriumUrl,
        disableTLS,
      };
      ipcRenderer.on('connect-reply', (_, result) => {
        setOutput(result.output);
        setDisconnectChannel(result.disconnectChannel);
      });
      ipcRenderer.on('connect-close', () => {
        setConnected(false);
      });

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
            <Grid container spacing={2} alignItems="center">
              {connected && (
                <Grid item xs={4}>
                  <Button type="button" variant="outlined" onClick={disconnect}>
                    Disconnect
                  </Button>
                </Grid>
              )}
              <Grid item xs={4}>
                <Button
                  type="button"
                  variant="outlined"
                  disabled={
                    localError ||
                    destinationError ||
                    pomeriumUrlError ||
                    connected
                  }
                  onClick={connect}
                >
                  Connect
                </Button>
              </Grid>
              <Grid item xs={4}>
                <Button type="button" variant="outlined" onClick={clear}>
                  New Connection
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </form>
      {!!output.length && (
        <Container className={classes.container}>
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
        </Container>
      )}
    </>
  );
};

export default ConnectForm;
