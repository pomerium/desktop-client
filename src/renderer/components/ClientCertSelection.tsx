import { Button, FormHelperText, Grid, Typography } from '@mui/material';
import React, { FC, useState } from 'react';
import TextArea from './TextArea';
import ManualClientCertSelection from './ManualClientCertSelection';

export type ClientCertSelectionProps = {
  onChangeCert: (cert: string) => void;
  onChangeKey: (key: string) => void;
};

const ClientCertSelection: FC<ClientCertSelectionProps> = ({
  onChangeCert,
  onChangeKey,
}) => {
  const supportsClientCertFromStore =
    process.platform === 'win32' || process.platform === 'darwin';
  if (!supportsClientCertFromStore) {
    return (
      <ManualClientCertSelection
        onChangeCert={onChangeCert}
        onChangeKey={onChangeKey}
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
};
