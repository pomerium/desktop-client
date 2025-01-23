import {
  FormControlLabel,
  FormHelperText,
  Grid,
  Switch,
  Typography,
} from '@mui/material';
import React, { FC } from 'react';

import { Connection } from '../../shared/pb/api';
import ClientCertSelection from './ClientCertSelection';
import TextField from './TextField';

export type AdvancedConnectionSettingsProps = {
  connection: Connection;
  onChangeConnection: (connection: Connection) => void;
};
const AdvancedConnectionSettings: FC<AdvancedConnectionSettingsProps> = ({
  connection,
  onChangeConnection,
}) => {
  const onToggleDisableTlsVerification = () => {
    onChangeConnection({
      ...connection,
      disableTlsVerification: !connection?.disableTlsVerification,
    });
  };
  const onChangeUrl = (evt: React.ChangeEvent<HTMLInputElement>) => {
    onChangeConnection({
      ...connection,
      pomeriumUrl: evt.target.value.trim() || undefined,
    });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Pomerium URL"
          value={connection?.pomeriumUrl || ''}
          onChange={onChangeUrl}
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
              onChange={onToggleDisableTlsVerification}
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
      <ClientCertSelection
        connection={connection}
        onChangeConnection={onChangeConnection}
      />
    </Grid>
  );
};
export default AdvancedConnectionSettings;
