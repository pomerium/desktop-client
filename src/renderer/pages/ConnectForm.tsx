/* eslint-disable react/jsx-props-no-spreading */
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Button,
  CardContent,
  Chip,
  Container,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  styled,
  Switch,
  Typography,
} from '@mui/material';
import { AccordionProps } from '@mui/material/Accordion';
import { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import React, { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, ChevronDown, ChevronRight, Trash } from 'react-feather';
import { ipcRenderer } from 'electron';
import { useSnackbar } from 'notistack';
import { set } from 'lodash';
import {
  GET_RECORDS,
  GET_UNIQUE_TAGS,
  SAVE_RECORD,
  TOAST_LENGTH,
  VIEW,
  VIEW_CONNECTION_LIST,
} from '../../shared/constants';
import TextField from '../components/TextField';
import StyledCard from '../components/StyledCard';
import { formatTag } from '../../shared/validators';
import {
  ClientCertFromStore,
  Connection,
  Record,
  Selector,
} from '../../shared/pb/api';
import BeforeBackActionDialog from '../components/BeforeBackActionDialog';
import CertDetails from '../components/CertDetails';
import CertFilter from '../components/CertFilter';
import ManualClientCertSelection from '../components/ManualClientCertSelection';

export const TextArea = styled(TextField)({
  '& div.MuiFilledInput-root': {
    background: `rgba(110, 67, 232, 0.05)`,
    padding: `0px`,
    marginTop: `10px`,
    display: `flex`,
    flexFlow: `row nowrap`,
    boxShadow: `0 0 0 1px rgb(63 63 68 / 5%), 0 1px 2px 0 rgb(63 63 68 / 15%)`,

    '& div.MuiFilledInput-root': {
      margin: `2px 0px 0px 6px`,
      height: `100%`,
    },
    '& input.MuiInputBase-input': {
      padding: `6px`,
      margin: `6px`,
    },

    '& .MuiFilledInput-inputMultiline': {
      padding: `10px`,
    },
  },
  '& div.MuiFilledInput-underline:before': {
    borderBottom: `0px`,
  },
  '& div.MuiFilledInput-underline:after': {
    border: `0px`,
  },
});

const NestedAccordion = styled((props: AccordionProps) => (
  <Accordion disableGutters elevation={0} {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  marginLeft: theme.spacing(2),
  width: '100%',
  '&:before': {
    display: 'none',
  },
}));

const NestedAccordionSummary = styled((props: AccordionSummaryProps) => (
  <AccordionSummary
    expandIcon={<ChevronRight sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, .05)'
      : 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
}));

const NestedAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
}));

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

export function getClientCertFiltersSummary(c: ClientCertFromStore): string {
  const filters = [];
  if (c?.issuerFilter) {
    filters.push('Issuer ' + c.issuerFilter);
  }
  if (c?.subjectFilter) {
    filters.push('Subject ' + c.subjectFilter);
  }
  return filters.join(', ');
}

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
  const [certText, setCertText] = useState('');
  const [keyText, setKeyText] = useState('');
  const [showCertInput, setShowCertInput] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

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
        setShowCertInput(!conn.clientCert);
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
    } else {
      setShowCertInput(true);
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

  const savePomeriumUrl = (value: string): void => {
    setConnection({
      ...connection,
      ...{ pomeriumUrl: value.trim() || undefined },
    });
  };

  const saveDisableTLS = (): void => {
    setConnection({
      ...connection,
      ...{ disableTlsVerification: !connection?.disableTlsVerification },
    });
  };

  const handleClickBack = (): void => {
    if (JSON.stringify(originalConnection) !== JSON.stringify(connection)) {
      setShowBackWarning(true);
    } else {
      ipcRenderer.send(VIEW_CONNECTION_LIST);
    }
  };

  const [clientCertFiltersExpanded, setClientCertFiltersExpanded] =
    useState(false);

  const saveClientCertFromStore = (
    value: ClientCertFromStore | undefined,
  ): void => {
    setConnection({
      ...connection,
      ...{ clientCertFromStore: value },
    });
    if (value === undefined) {
      setClientCertFiltersExpanded(false);
    }
  };

  const saveClientCertIssuerFilter = (value: string | undefined): void => {
    saveClientCertFromStore({
      ...connection?.clientCertFromStore,
      ...{ issuerFilter: value },
    });
  };

  const saveClientCertSubjectFilter = (value: string | undefined): void => {
    saveClientCertFromStore({
      ...connection?.clientCertFromStore,
      ...{ subjectFilter: value },
    });
  };

  const clientCertFiltersSummary = getClientCertFiltersSummary(
    connection?.clientCertFromStore,
  );

  const saveCertText = (value: string): void => {
    setCertText(value);
    setConnection((oldConnection) => {
      set(oldConnection, 'clientCert.cert', new TextEncoder().encode(value));
      return oldConnection;
    });
  };

  const saveKeyText = (value: string): void => {
    setKeyText(value);
    setConnection((oldConnection) => {
      set(oldConnection, 'clientCert.key', new TextEncoder().encode(value));
      return oldConnection;
    });
  };

  const handleDeleteCert = () => {
    setConnection((oldConnection) => {
      oldConnection.clientCert = undefined;
      return oldConnection;
    });
    setShowCertInput(true);
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
    if (certText && !keyText) {
      return false;
    }
    if (!!keyText && !certText) {
      return false;
    }
    return !!connection?.name && !!connection?.remoteAddr.trim();
  };

  const clientCertFromStoreEnabled =
    connection?.clientCertFromStore !== undefined;

  const manualClientCertSection = (
    <>
      {showCertInput && (
        <ManualClientCertSelection
          onChangeCert={saveCertText}
          onChangeKey={saveKeyText}
        />
      )}

      {!showCertInput && (
        <Grid item xs={12}>
          <CertDetails
            open={showDetail}
            onClose={() => setShowDetail(false)}
            certInfo={connection?.clientCert?.info}
          />
          <Typography variant="body2">Client Certificate</Typography>
          <Chip
            label="Details"
            color="primary"
            onClick={() => setShowDetail(true)}
          />
          <IconButton
            aria-label="delete"
            onClick={handleDeleteCert}
            color="primary"
            size="large"
          >
            <Trash />
          </IconButton>
        </Grid>
      )}
    </>
  );

  let clientCertSection = manualClientCertSection;
  const supportsClientCertFromStore =
    process.platform === 'win32' || process.platform === 'darwin';
  if (supportsClientCertFromStore) {
    clientCertSection = (
      <>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={clientCertFromStoreEnabled}
                color="primary"
                onChange={(evt): void =>
                  saveClientCertFromStore(evt.target.checked ? {} : undefined)
                }
              />
            }
            label="Search OS certificate store"
          />
          <FormHelperText sx={{ pl: 2 }}>
            Searches for a client certificate based on the trusted CA names
            provided in the TLS connection handshake.
          </FormHelperText>
        </Grid>
        <NestedAccordion
          sx={{ mt: 2 }}
          disabled={!clientCertFromStoreEnabled}
          expanded={clientCertFiltersExpanded}
          onChange={(evt, expanded) => setClientCertFiltersExpanded(expanded)}
        >
          <NestedAccordionSummary>
            <Typography>
              Additional OS certificate store filters
              {!clientCertFiltersExpanded && clientCertFiltersSummary && (
                <>
                  :<br />
                  {clientCertFiltersSummary}
                </>
              )}
            </Typography>
          </NestedAccordionSummary>
          <NestedAccordionDetails>
            {clientCertFromStoreEnabled && (
              <>
                <CertFilter
                  label="Issuer Name"
                  data={connection?.clientCertFromStore?.issuerFilter}
                  onChange={saveClientCertIssuerFilter}
                  disabled={!clientCertFromStoreEnabled}
                />
                <CertFilter
                  label="Subject Name"
                  data={connection?.clientCertFromStore?.subjectFilter}
                  onChange={saveClientCertSubjectFilter}
                  disabled={!clientCertFromStoreEnabled}
                />
              </>
            )}
          </NestedAccordionDetails>
        </NestedAccordion>

        <NestedAccordion sx={{ my: 2 }}>
          <NestedAccordionSummary>
            <Typography>Set client certificate manually</Typography>
          </NestedAccordionSummary>
          <NestedAccordionDetails>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              {manualClientCertSection}
            </Grid>
          </NestedAccordionDetails>
        </NestedAccordion>
      </>
    );
  }

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
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Pomerium URL"
                  value={connection?.pomeriumUrl || ''}
                  onChange={(evt): void => savePomeriumUrl(evt.target.value)}
                  variant="outlined"
                  autoFocus
                  helperText="URL of a Bastion host to use for the initial TLS connection"
                />
              </Grid>
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
                <FormHelperText sx={{ pl: 2 }}>
                  Skips TLS verification. No Cert Authority Needed.
                </FormHelperText>
              </Grid>
              <Grid item xs={12}>
                <Typography sx={{ fontWeight: 500, pt: 1 }}>
                  Client certificates
                </Typography>
              </Grid>
              {clientCertSection}
            </Grid>
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
