/* eslint-disable react/jsx-props-no-spreading */
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Container,
  FormControlLabel,
  FormHelperText,
  Grid,
  makeStyles,
  Switch,
  Typography,
} from '@material-ui/core';
import React, { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, ChevronDown } from 'react-feather';
import { Autocomplete } from '@material-ui/lab';
import { ipcRenderer } from 'electron';
import {
  GET_RECORDS,
  GET_RECORDS_RESPONSE,
  QueryParams,
  SAVE,
  SAVE_RESPONSE,
  VIEW,
} from '../../shared/constants';
import TextField from '../components/TextField';
import { Theme } from '../../shared/theme';
import Card from '../components/Card';
import { formatTag } from '../../shared/connections';
import { Connection, Record, Selector } from '../../shared/pb/api';

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

interface Props {
  onComplete?: () => void;
}

const initialConnData: Connection = {
  name: '',
  remoteAddr: '',
  listenAddr: '',
  pomeriumUrl: '',
  disableTlsVerification: false,
  caCert: undefined,
};

const ConnectForm: FC<Props> = () => {
  const classes = useStyles();
  const [error, setError] = useState([]);
  const [tags, setTags] = useState<string[]>([]);
  const [connection, setConnection] = useState(initialConnData);
  const [refresh, setRefresh] = useState('');
  const [tagOptions, setTagOptions] = useState([] as string[]);
  const handleSubmit = (evt: React.FormEvent): void => {
    evt.preventDefault();
  };
  const { connectionID }: QueryParams = useParams();

  // todo something with error and refresh and add tagOptions

  useEffect(() => {
    if (connectionID) {
      ipcRenderer.once(GET_RECORDS_RESPONSE, (_, args) => {
        if (args.err) {
          setError(args.err);
        } else if (args.res.records.length === 1) {
          setTags(args.res.records[0].tags || []);
          setConnection(args.res.records[0].conn || initialConnData);
        }
      });
      ipcRenderer.send(GET_RECORDS, {
        all: false,
        ids: [connectionID],
        tags: [],
      } as Selector);
    }
  }, [connectionID]);

  useEffect(() => {
    if (refresh) {
      setRefresh('');
      // reset data here for id or intialdata
    }
  }, [refresh]);

  const saveName = (value: string): void => {
    setConnection({
      ...connection,
      ...{ name: value },
    });
  };

  const saveTags = (arr: string[]): void => {
    setTags(arr.map((tag) => formatTag(tag)));
  };

  const saveDestination = (value: string): void => {
    setConnection({
      ...connection,
      ...{ remoteAddr: value.trim() },
    });
  };

  const saveLocal = (value: string): void => {
    setConnection({ ...connection, ...{ listenAddr: value.trim() } });
  };

  const savePomeriumUrl = (value: string): void => {
    setConnection({ ...connection, ...{ pomeriumUrl: value.trim() } });
  };

  const saveDisableTLS = (): void => {
    setConnection({
      ...connection,
      ...{ disableTlsVerification: !connection?.disableTlsVerification },
    });
  };

  const saveConnection = (): void => {
    const record = {
      tags,
      conn: connection,
    } as Record;

    if (connectionID) {
      record.id = connectionID;
    }
    ipcRenderer.once(SAVE_RESPONSE, (_, args) => {
      if (args.err) {
        setError(args.err);
      } else if (args.res) {
        ipcRenderer.send(VIEW, args.res.id);
      }
    });
    ipcRenderer.send(SAVE, record);
  };

  const discardChanges = (): void => {
    setRefresh('yes');
  };

  function saveCaFilePath(value: string) {
    console.log(value);
    // do nothing with value
  }

  return (
    <Container maxWidth={false}>
      <form onSubmit={handleSubmit}>
        <Grid className={classes.titleGrid}>
          <Grid container alignItems="flex-start">
            <Grid item xs={12}>
              <Typography variant="h3" color="textPrimary">
                {connectionID ? 'Edit' : 'Add'} Connection
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
                label="Name"
                value={connection?.name}
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
                label="Destination URL"
                value={connection?.remoteAddr}
                onChange={(evt): void => saveDestination(evt.target.value)}
                variant="outlined"
                autoFocus
                helperText="The remote address to connect to. The FROM field in a pomerium route."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Local Address"
                value={connection?.listenAddr}
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
                value={tags || []}
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
                      const { value } = element;
                      if (e.key === 'Enter' && value.trim()) {
                        saveTags(tags.concat(value));
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
            <Typography variant="h5">Advanced Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={connection?.disableTlsVerification}
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
                  label="Alternate Pomerium URL"
                  value={connection.pomeriumUrl}
                  onChange={(evt): void => savePomeriumUrl(evt.target.value)}
                  variant="outlined"
                  helperText="Pomerium Proxy Url. Useful if the Destination URL isn't publicly resolvable"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="CA File Path"
                  value="todo file picker"
                  onChange={(evt): void => saveCaFilePath(evt.target.value)}
                  variant="outlined"
                  helperText="If Pomerium is using a CA in your system's trusted keychain you can provide the path to it here."
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
              disabled={!connection?.name || !connection?.remoteAddr.trim()}
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
    </Container>
  );
};

export default ConnectForm;
