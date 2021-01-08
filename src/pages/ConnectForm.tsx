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
} from '@material-ui/core';
import React, { FC, useState } from 'react';
import { isUrl, isIp } from '../utils/validators';

const useStyles = makeStyles(() => ({
  container: {
    padding: 3,
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

  const connect = (): void => {
    if (!localError && !destinationError && !pomeriumUrlError) {
      alert('here');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Container className={classes.container}>
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
          <Grid item xs={12}>
            <Button type="button" variant="outlined" onClick={connect}>
              Connect
            </Button>
          </Grid>
        </Grid>
      </Container>
    </form>
  );
};

export default ConnectForm;
