/* eslint-disable react/jsx-props-no-spreading */
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Button,
  CardContent,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import { ipcRenderer } from 'electron';
import { useSnackbar } from 'notistack';
import React, { FC, useEffect, useState } from 'react';
import { CheckCircle, ChevronDown } from 'react-feather';
import { useParams } from 'react-router-dom';

import {
  GET_RECORDS,
  GET_UNIQUE_TAGS,
  SAVE_RECORD,
  TOAST_LENGTH,
  VIEW,
  VIEW_CONNECTION_LIST,
} from '../../shared/constants';
import { Connection, Record, Selector } from '../../shared/pb/api';
import { formatTag } from '../../shared/validators';
import AdvancedConnectionSettings from '../components/AdvancedConnectionSettings';
import BeforeBackActionDialog from '../components/BeforeBackActionDialog';
import StyledCard from '../components/StyledCard';
import TextField from '../components/TextField';

interface Props {
  onComplete?: () => void;
}

const initialConnData: Connection = {
  name: undefined,
  remoteAddr: '',
  listenAddr: undefined,
  pomeriumUrl: undefined,
  disableTlsVerification: false,
  caCert: undefined,
  clientCert: undefined,
  clientCertFromStore: undefined,
};

const ConnectForm: FC<Props> = () => {
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [connection, setConnection] = useState(initialConnData);
  const [originalConnection, setOriginalConnection] = useState(initialConnData);
  const [tagOptions, setTagOptions] = useState([] as string[]);
  const handleSubmit = (evt: React.FormEvent): void => {
    evt.preventDefault();
  };
  const { connectionID } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    ipcRenderer.on(GET_RECORDS, (_, args) => {
      if (args.err) {
        enqueueSnackbar(args.err.message, {
          variant: 'error',
          autoHideDuration: TOAST_LENGTH,
        });
      } else if (args.res.records.length === 1) {
        setTags(args.res.records[0].tags || []);
        const { conn } = args.res.records[0];
        setConnection(conn || initialConnData);
        setOriginalConnection(conn || initialConnData);
      }
    });
    ipcRenderer.once(GET_UNIQUE_TAGS, (_, args) => {
      if (args.tags && !args.err) {
        setTagOptions(args.tags);
      }
    });
    ipcRenderer.send(GET_UNIQUE_TAGS);

    if (connectionID) {
      ipcRenderer.send(GET_RECORDS, {
        all: false,
        ids: [connectionID],
        tags: [],
      } as Selector);
    }
    return function cleanup() {
      ipcRenderer.removeAllListeners(GET_RECORDS);
      ipcRenderer.removeAllListeners(GET_UNIQUE_TAGS);
    };
  }, []);

  const saveName = (value: string): void => {
    setConnection({
      ...connection,
      ...{ name: value || undefined },
    });
  };

  const saveTags = (arr: string[]): void => setTags(arr.map(formatTag));

  const saveDestination = (value: string): void => {
    setConnection({
      ...connection,
      ...{ remoteAddr: value.trim() },
    });
  };

  const saveLocal = (value: string): void => {
    setConnection({
      ...connection,
      ...{ listenAddr: value.trim() || undefined },
    });
  };

  const handleClickBack = (): void => {
    if (JSON.stringify(originalConnection) !== JSON.stringify(connection)) {
      setShowBackWarning(true);
    } else {
      ipcRenderer.send(VIEW_CONNECTION_LIST);
    }
  };

  const saveConnection = (): void => {
    const record = {
      tags,
      conn: connection,
    } as Record;

    if (connectionID) {
      record.id = connectionID;
    }
    ipcRenderer.once(SAVE_RECORD, (_, args) => {
      if (args.err) {
        enqueueSnackbar(args.err.message, {
          variant: 'error',
          autoHideDuration: TOAST_LENGTH,
        });
      } else if (args.res) {
        ipcRenderer.send(VIEW, args.res.id);
      }
    });
    ipcRenderer.send(SAVE_RECORD, record);
  };

  const canSave = (): boolean => {
    if (connection?.clientCert?.cert && !connection?.clientCert?.key) {
      return false;
    }
    if (!!connection?.clientCert?.key && !connection?.clientCert?.cert) {
      return false;
    }
    return !!connection?.name && !!connection?.remoteAddr.trim();
  };

  return (
    <Container maxWidth={false}>
      <BeforeBackActionDialog
        open={showBackWarning}
        onClose={() => setShowBackWarning(false)}
      />
      <form onSubmit={handleSubmit}>
        <Grid sx={{ pt: 4 }}>
          <Grid container alignItems="flex-start">
            <Grid item xs={12}>
              <Typography variant="h3" color="textPrimary">
                {connectionID ? 'Edit' : 'Add'} Connection
              </Typography>
            </Grid>
          </Grid>
        </Grid>

        <StyledCard>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Name"
                  value={connection?.name || ''}
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
                  label="Destination"
                  value={connection?.remoteAddr}
                  onChange={(evt): void => saveDestination(evt.target.value)}
                  variant="outlined"
                  helperText="The remote address to connect to. Example: mysql.example.com:3306 or tcp+https://proxy.example.com/mysql.example.com:3306"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Local Address"
                  value={connection?.listenAddr || ''}
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
          </CardContent>
        </StyledCard>

        <Accordion
          sx={{
            backgroundColor: 'background.paper',
            marginTop: 2,
            paddingLeft: 2,
            paddingRight: 2,
            borderRadius: 4,
            '&:before': {
              display: 'none',
            },
          }}
          square={false}
        >
          <AccordionSummary
            expandIcon={<ChevronDown />}
            aria-controls="advanced-settings-content"
            id="advanced-settings-header"
          >
            <Typography variant="h5">Advanced Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AdvancedConnectionSettings
              connection={connection}
              onChangeConnection={setConnection}
            />
          </AccordionDetails>
        </Accordion>

        <Grid
          container
          spacing={2}
          alignItems="flex-end"
          justifyContent="flex-end"
          sx={{ mt: 3 }}
        >
          <Grid item>
            <Button
              type="button"
              variant="contained"
              color="secondary"
              onClick={handleClickBack}
            >
              Back
            </Button>
          </Grid>
          <Grid item>
            <Button
              type="button"
              variant="contained"
              disabled={!canSave()}
              color="primary"
              onClick={saveConnection}
              endIcon={<CheckCircle />}
            >
              Save
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default ConnectForm;
