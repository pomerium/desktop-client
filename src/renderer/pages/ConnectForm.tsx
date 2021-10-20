import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  capitalize,
  Container,
  FormControlLabel,
  FormHelperText,
  Grid,
  makeStyles,
  Paper,
  Switch,
  Typography,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';
import React, { FC, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router-dom';
import Store from 'electron-store';
import { isIp } from '../../shared/validators';
import {
  ConnectionData,
  SAVE_CONNECTION,
  SAVE_CONNECTION_RESPONSE,
} from '../../shared/constants';
import TextField from '../components/TextField';
import { Theme } from '../../shared/theme';
import Card from '../components/Card';
import { CheckCircle, ChevronDown } from 'react-feather';
import { Autocomplete } from '@material-ui/lab';

const useStyles = makeStyles((theme: Theme) => ({
  titleGrid: {
    paddingTop: theme.spacing(4),
  },
  leftPad: {
    paddingLeft: theme.spacing(2),
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
  accordion: {
    backgroundColor: theme.palette.background.default,
    marginTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    borderRadius: '16px',
    '&:before': {
      display: 'none',
    },
  },
}));

interface Props {
  onComplete?: () => void;
}

const noErrors = {
  name: false,
  localAddress: false,
  destinationUrl: false,
  pomeriumUrl: false,
  caFilePath: false,
  caFileText: false,
  tags: false,
};

const initialConnectionData: ConnectionData = {
  name: '',
  destinationUrl: '',
  localAddress: '',
  pomeriumUrl: '',
  disableTLS: false,
  caFileText: '',
  caFilePath: '',
  channelID: '',
  tags: [],
};

interface QueryParams {
  channelId: string;
  editingConnected: string;
}

const ConnectForm: FC<Props> = () => {
  const classes = useStyles();
  const [errors, setErrors] = useState(noErrors);
  const [connectionData, setConnectionData] = useState(initialConnectionData);
  const [refresh, setRefresh] = useState('');
  const [tagOptions, setTagOptions] = useState([] as string[]);
  const handleSubmit = (evt: React.FormEvent): void => {
    evt.preventDefault();
  };

  const { channelId, editingConnected }: QueryParams = useParams();
  useEffect(() => {
    if (channelId) {
      fetchData();
    }
  }, [channelId, editingConnected]);

  useEffect(() => {
    if (refresh) {
      setRefresh('');
      if (channelId) {
        fetchData();
      } else {
        setConnectionData(initialConnectionData);
      }
    }
  }, [refresh]);

  const fetchData = (): void => {
    const store = new Store({ name: 'connections' });
    const data = store.get('connections') as Record<
      ConnectionData['channelID'],
      ConnectionData
    >;
    if (data[channelId]) {
      setConnectionData(data[channelId]);
    }
    const existingTags = new Set<string>();
    Object.entries(data).forEach(([_, connection]) => {
      connection?.tags?.forEach((tag) => {
        existingTags.add(tag);
      });
    });
    setTagOptions([...existingTags].sort());
  };

  const saveName = (value: string): void => {
    setConnectionData({
      ...connectionData,
      ...{ name: value.trim() },
    });
    setErrors({
      ...errors,
      ...{ name: !value.trim() },
    });
  };

  const formatTag = (tag: string): string => {
    return tag
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((word) => capitalize(word.toLocaleLowerCase()))
      .join(' ');
  };

  const saveTags = (arr: string[]): void => {
    setConnectionData({
      ...connectionData,
      ...{ tags: arr.map((tag) => formatTag(tag)) },
    });
    setErrors({
      ...errors,
      ...{ tags: !Array.isArray(arr) },
    });
  };

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

  useEffect(() => {
    ipcRenderer.removeAllListeners(SAVE_CONNECTION_RESPONSE);
    ipcRenderer.on(SAVE_CONNECTION_RESPONSE, (_, msg) => {
      console.log(msg);
    });
  }, [connectionData.channelID]);

  const saveConnection = (): void => {
    if (Object.values(errors).every((error) => !error)) {
      const args: ConnectionData = { ...connectionData };
      if (!args.channelID) {
        args.channelID = uuidv4();
      }
      setConnectionData(args);
      ipcRenderer.send(SAVE_CONNECTION, args);
    }
  };

  const discardChanges = (): void => {
    setRefresh('yes');
  };

  return (
    <Container component={Paper} maxWidth={false}>
      <form onSubmit={handleSubmit}>
        <Grid className={classes.titleGrid}>
          <Grid container alignItems="flex-start">
            <Grid item xs={12}>
              <Typography variant="h3" color="textPrimary">
                {connectionData.channelID ? 'Edit' : 'Add'} Connection
              </Typography>
            </Grid>
          </Grid>
        </Grid>

        <Card>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={'Name'}
                value={connectionData.name}
                onChange={(evt): void => saveName(evt.target.value)}
                variant="outlined"
                autoFocus
                helperText="Name of the route."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={'Destination URL'}
                value={connectionData.destinationUrl}
                onChange={(evt): void => saveDestination(evt.target.value)}
                variant="outlined"
                autoFocus
                helperText="The url to connect to. The FROM field in a pomerium route."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={'Local Address'}
                error={errors.localAddress}
                value={connectionData.localAddress}
                onChange={(evt): void => saveLocal(evt.target.value)}
                variant="outlined"
                helperText="The port or local address you want to connect to. Ex. :8888 or 127.0.0.1:8888"
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="tags-outlined"
                options={tagOptions}
                value={connectionData.tags || []}
                onChange={(_, arr) => {
                  saveTags(arr);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Tags..."
                    placeholder="Tags"
                    onKeyDown={(e) => {
                      const element = e.target as HTMLInputElement;
                      const value = element.value;
                      if (e.key === 'Enter' && value.trim()) {
                        saveTags(connectionData.tags.concat(value));
                      }
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Card>

        <Accordion className={classes.accordion} square={false}>
          <AccordionSummary
            expandIcon={<ChevronDown />}
            aria-controls="advanced-settings-content"
            id="advanced-settings-header"
          >
            <Typography variant={'h5'}>Advanced Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={connectionData.disableTLS}
                      name="disable-tls-verification"
                      color="primary"
                      onChange={saveDisableTLS}
                    />
                  }
                  label="Disable TLS Verification"
                />
                <FormHelperText className={classes.leftPad}>
                  Skips TLS verification. No Cert Authority Needed.
                </FormHelperText>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={'Alternate Pomerium URL'}
                  error={errors.pomeriumUrl}
                  value={connectionData.pomeriumUrl}
                  onChange={(evt): void => savePomeriumUrl(evt.target.value)}
                  variant="outlined"
                  helperText="Pomerium Proxy Url. Useful if the Destination URL isn't publicly resolvable"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={'CA File Path'}
                  error={errors.caFilePath}
                  value={connectionData.caFilePath}
                  onChange={(evt): void => saveCaFilePath(evt.target.value)}
                  variant="outlined"
                  helperText="If Pomerium is using a CA in your system's trusted keychain you can provide the path to it here."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={'CA File Text'}
                  error={errors.caFileText}
                  value={connectionData.caFileText}
                  onChange={(evt): void => saveCaFileText(evt.target.value)}
                  variant="outlined"
                  multiline
                  rows={4}
                  helperText="If Pomerium is using a CA in your system's trusted keychain you can copy/paste it here."
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Grid
          container
          spacing={2}
          alignItems="flex-end"
          justifyContent="flex-end"
          className={classes.buttonWrapper}
        >
          <Grid item>
            <Button
              type="button"
              variant="contained"
              disabled={
                Object.values(errors).some(Boolean) ||
                !connectionData.name.trim() ||
                !connectionData.destinationUrl.trim()
              }
              color="primary"
              onClick={saveConnection}
              endIcon={<CheckCircle />}
            >
              Save
            </Button>
          </Grid>
          <Grid item>
            <Button
              type="button"
              variant="contained"
              color="secondary"
              onClick={discardChanges}
            >
              Discard
            </Button>
          </Grid>
        </Grid>
      </form>
      <Box minHeight={'90px'} overflow={'hidden'} />
    </Container>
  );
};

export default ConnectForm;
