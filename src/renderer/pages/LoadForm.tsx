import {
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
import { defaultsDeep, isEqual } from 'lodash';
import { enqueueSnackbar } from 'notistack';
import React, { FC, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import {
  DELETE,
  TOAST_LENGTH,
  VIEW_CONNECTION_LIST,
} from '../../shared/constants';
import { fetchRoutes, getAllRecords, saveRecord } from '../../shared/ipc';
import { Connection, PortalRoute, Protocol, Record } from '../../shared/pb/api';
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

  return defaultsDeep(
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

async function reconcileConnections(
  baseRecord: Record,
  portalRoutes: PortalRoute[],
) {
  const res = await getAllRecords();

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
      await saveRecord(r);
      continue;
    }
    const nr = defaultsDeep(r, cr);
    if (!isEqual(nr, cr)) {
      await saveRecord(nr);
    }
  }

  await getAllRecords();
}

const LoadForm: FC = () => {
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
  const [loading, setLoading] = useState(false);

  const onChangeUrl = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setServerUrl(evt.target.value);
  };
  const onClickBack = (evt: React.MouseEvent) => {
    evt.preventDefault();
    ipcRenderer.send(VIEW_CONNECTION_LIST);
  };
  const onClickLoad = (evt: React.MouseEvent) => {
    evt.preventDefault();

    (async () => {
      try {
        setLoading(true);
        if (serverUrl) {
          const res = await fetchRoutes({
            serverUrl,
            disableTlsVerification: connection.disableTlsVerification,
            caCert: connection.caCert,
            clientCert: connection.clientCert,
            clientCertFromStore: connection.clientCertFromStore,
          });
          await reconcileConnections(
            {
              tags,
              conn: connection,
            },
            res?.routes || [],
          );
        }
      } catch (e) {
        enqueueSnackbar(`${(e as any)?.message || e}`, {
          variant: 'error',
          autoHideDuration: TOAST_LENGTH,
        });
      } finally {
        setLoading(false);
      }
    })();
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
      <Container maxWidth={false} sx={{ pt: 4 }}>
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Typography variant="h3" color="textPrimary">
              Load Connections
            </Typography>
            <StyledCard>
              <CardContent>
                <Stack spacing={2}>
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
                </Stack>
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
                disabled={!serverUrl || loading}
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
