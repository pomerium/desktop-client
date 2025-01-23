import {
  FormControlLabel,
  FormHelperText,
  Grid,
  Switch,
  Typography,
} from '@mui/material';
import React, { FC, useState } from 'react';

import { ClientCertFromStore, Connection } from '../../shared/pb/api';
import CertFilter from './CertFilter';
import ManualClientCertSelection from './ManualClientCertSelection';
import NestedAccordion from './NestedAccordion';
import NestedAccordionDetails from './NestedAccordionDetails';
import NestedAccordionSummary from './NestedAccordionSummary';

export function getClientCertFiltersSummary(c?: ClientCertFromStore): string {
  const filters: string[] = [];
  if (c?.issuerFilter) {
    filters.push('Issuer ' + c.issuerFilter);
  }
  if (c?.subjectFilter) {
    filters.push('Subject ' + c.subjectFilter);
  }
  return filters.join(', ');
}

export type ClientCertSelectionProps = {
  connection: Connection;
  onChangeConnection: (connection: Connection) => void;
};
const ClientCertSelection: FC<ClientCertSelectionProps> = ({
  connection,
  onChangeConnection,
}) => {
  const [clientCertFiltersExpanded, setClientCertFiltersExpanded] =
    useState(false);
  const clientCertFromStoreEnabled =
    connection?.clientCertFromStore !== undefined;
  const clientCertFiltersSummary = getClientCertFiltersSummary(
    connection?.clientCertFromStore,
  );

  const onChangeClientCertIssuerFilter = (value: string | undefined): void => {
    onChangeConnection({
      ...connection,
      ...{
        clientCertFromStore: {
          ...connection.clientCertFromStore,
          issuerFilter: value,
        },
      },
    });
  };
  const onChangeClientCertSubjectFilter = (value: string | undefined): void => {
    onChangeConnection({
      ...connection,
      ...{
        clientCertFromStore: {
          ...connection.clientCertFromStore,
          subjectFilter: value,
        },
      },
    });
  };
  const onToggleClientCertFromStore = (): void => {
    onChangeConnection({
      ...connection,
      ...{
        clientCertFromStore: connection.clientCertFromStore ? undefined : {},
      },
    });
  };

  const supportsClientCertFromStore =
    process.platform === 'win32' || process.platform === 'darwin';
  if (!supportsClientCertFromStore) {
    return (
      <ManualClientCertSelection
        connection={connection}
        onChangeConnection={onChangeConnection}
      />
    );
  }

  return (
    <>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={clientCertFromStoreEnabled}
              color="primary"
              onChange={onToggleClientCertFromStore}
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
                onChange={onChangeClientCertIssuerFilter}
                disabled={!clientCertFromStoreEnabled}
              />
              <CertFilter
                label="Subject Name"
                data={connection?.clientCertFromStore?.subjectFilter}
                onChange={onChangeClientCertSubjectFilter}
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
            <ManualClientCertSelection
              connection={connection}
              onChangeConnection={onChangeConnection}
            />
          </Grid>
        </NestedAccordionDetails>
      </NestedAccordion>
    </>
  );
};
export default ClientCertSelection;
