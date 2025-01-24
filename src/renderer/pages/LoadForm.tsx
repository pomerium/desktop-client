import {
  Autocomplete,
  Button,
  CardContent,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { ipcRenderer } from 'electron';
import { defaults, isEqual } from 'lodash';
import { enqueueSnackbar } from 'notistack';
import React, { FC, useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import {
  DELETE,
  FETCH_ROUTES,
  FetchRoutesResponseArgs,
  GET_ALL_RECORDS,
  GetRecordsResponseArgs,
  SAVE_RECORD,
  TOAST_LENGTH,
  VIEW_CONNECTION_LIST,
} from '../../shared/constants';
import {
  Connection,
  FetchRoutesRequest,
  PortalRoute,
  Protocol,
  Record,
} from '../../shared/pb/api';
import AdvancedSettingsAccordion from '../components/AdvancedSettingsAccordion';
import ClientCertSelection from '../components/ClientCertSelection';
import StyledCard from '../components/StyledCard';
import TagSelector from '../components/TagSelector';
import TextField from '../components/TextField';

function portalRouteToRecord(
  baseRecord: Record,
  portalRoute: PortalRoute,
): Record {
  const from = new URL(
    portalRoute.from.replace(/^(udp[+])|(tcp[+])(.*?)$/, '$3'),
  );
  const remoteAddr =
    from.pathname === '/' ? from.host : from.pathname.substring(1);
  const pomeriumUrl = from.pathname === '/' ? undefined : from.toString();

  return defaults(
    {
      source: `portal-route-${portalRoute.id}`,
      conn: {
        name: portalRoute.name,
        protocol: portalRoute.type === 'tcp' ? Protocol.TCP : Protocol.UDP,
        remoteAddr,
        pomeriumUrl,
      },
    },
    baseRecord,
  );
}

function reconcileConnections(baseRecord: Record, portalRoutes: PortalRoute[]) {
  ipcRenderer.once(GET_ALL_RECORDS, (_, args) => {
    const { err, res }: GetRecordsResponseArgs = args;
    if (err) {
      enqueueSnackbar(err.message, {
        variant: 'error',
        autoHideDuration: TOAST_LENGTH,
      });
      return;
    }

    const currentRecords = new Map<string, Record>(
      res?.records
        ?.filter((r) => r.source?.startsWith('portal-route-'))
        ?.map((r) => [r.source || '', r]) || [],
    );
    const newRecords = new Map<string, Record>(
      portalRoutes
        ?.filter((pr) => pr.type === 'tcp' || pr.type === 'udp')
        ?.map((pr) => portalRouteToRecord(baseRecord, pr))
        ?.map((r) => [r.source || '', r]) || [],
    );

    // remove current records which have been deleted
    for (const [k, r] of currentRecords) {
      if (!newRecords.has(k)) {
        ipcRenderer.send(DELETE, {
          ids: [r.id],
        });
      }
    }

    // add or update new records which have changed
    for (const [k, r] of newRecords) {
      const cr = currentRecords.get(k);
      if (!cr) {
        ipcRenderer.send(SAVE_RECORD, r);
        return;
      }
      const nr = defaults(r, cr);
      if (!isEqual(nr, cr)) {
        ipcRenderer.send(SAVE_RECORD, nr);
      }
    }
  });
  ipcRenderer.send(GET_ALL_RECORDS);
}

export type LoadFormProps = {};

const LoadForm: FC<LoadFormProps> = ({}) => {
  const [serverUrl, setServerUrl] = useLocalStorage('LoadForm/serverUrl', '');
  const [connection, setConnection] = useLocalStorage(
    'LoadForm/connection',
    (): Connection => {
      return {
        remoteAddr: '',
      };
    },
  );
  const [tags, setTags] = useLocalStorage('LoadForm/tags', (): string[] => []);

  const onChangeUrl = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setServerUrl(evt.target.value);
  };
  const onClickBack = (evt: React.MouseEvent) => {
    evt.preventDefault();
    ipcRenderer.send(VIEW_CONNECTION_LIST);
  };
  const onClickLoad = (evt: React.MouseEvent) => {
    evt.preventDefault();

    if (serverUrl) {
      const req: FetchRoutesRequest = {
        serverUrl,
        disableTlsVerification: connection.disableTlsVerification,
        caCert: connection.caCert,
        clientCert: connection.clientCert,
        clientCertFromStore: connection.clientCertFromStore,
      };
      ipcRenderer.once(FETCH_ROUTES, (_, args) => {
        const { err, res }: FetchRoutesResponseArgs = args;
        if (err) {
          enqueueSnackbar(err.message, {
            variant: 'error',
            autoHideDuration: TOAST_LENGTH,
          });
          return;
        }
        reconcileConnections(
          {
            tags,
            conn: connection,
          },
          res?.routes || [],
        );
      });
      ipcRenderer.send(FETCH_ROUTES, req);
    }
  };
  const onSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
  };
  const onToggleDisableTlsVerification = () => {
    setConnection({
      ...connection,
      disableTlsVerification: connection?.disableTlsVerification
        ? undefined
        : true,
    });
  };

  return (
    <>
      <Container maxWidth={false} sx={{ pt: 3 }}>
        <form onSubmit={onSubmit}>
          <Stack spacing={3}>
            <Typography variant="h3" color="textPrimary">
              Load Connections
            </Typography>
            <StyledCard>
              <CardContent>
                <TextField
                  fullWidth
                  required
                  label="Pomerium URL"
                  value={serverUrl}
                  onChange={onChangeUrl}
                  variant="outlined"
                  autoFocus
                  helperText="URL of a Pomerium Instance"
                />
                <TagSelector tags={tags} onChangeTags={setTags} />
              </CardContent>
            </StyledCard>
            <AdvancedSettingsAccordion>
              <Stack spacing={2}>
                <FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!connection?.disableTlsVerification}
                        name="disable-tls-verification"
                        color="primary"
                        onChange={onToggleDisableTlsVerification}
                      />
                    }
                    label="Disable TLS Verification"
                  />
                  <FormHelperText sx={{ pl: 2 }}>
                    Skips TLS verification. No Cert Authority Needed.
                  </FormHelperText>
                </FormControl>
                <FormControl>
                  <Typography sx={{ fontWeight: 500, pt: 1 }}>
                    Client certificates
                  </Typography>
                  <ClientCertSelection
                    connection={connection}
                    onChangeConnection={setConnection}
                  />
                </FormControl>
              </Stack>
            </AdvancedSettingsAccordion>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                type="button"
                variant="contained"
                color="secondary"
                onClick={onClickBack}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="contained"
                color="primary"
                disabled={!serverUrl}
                onClick={onClickLoad}
              >
                Load
              </Button>
            </Stack>
          </Stack>
        </form>
      </Container>
    </>
  );
};
export default LoadForm;
