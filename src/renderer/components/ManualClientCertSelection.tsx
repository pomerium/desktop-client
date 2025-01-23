import React, { FC, useEffect, useState } from 'react';
import { Connection } from '../../shared/pb/api';
import {
  Button,
  Chip,
  FormHelperText,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import TextArea from './TextArea';
import CertDetails from './CertDetails';
import { Trash } from 'react-feather';
import { set } from 'lodash';

export type ManualClientCertSelectionProps = {
  connection: Connection;
  onChangeConnection: (connection: Connection) => void;
};
const ManualClientCertSelection: FC<ManualClientCertSelectionProps> = ({
  connection,
  onChangeConnection,
}) => {
  const [showCertInput, setShowCertInput] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const certText = connection?.clientCert?.cert
    ? new TextDecoder().decode(connection.clientCert.cert)
    : '';
  const keyText = connection?.clientCert?.key
    ? new TextDecoder().decode(connection.clientCert.key)
    : '';

  useEffect(() => {
    if (connection?.clientCert?.info) {
      setShowCertInput(false);
    } else {
      setShowCertInput(true);
    }
  }, [!!connection?.clientCert?.info]);

  const saveCertText = (value: string): void => {
    const c = { ...connection };
    set(c, 'clientCert.cert', new TextEncoder().encode(value));
    onChangeConnection(c);
  };
  const saveKeyText = (value: string): void => {
    const c = { ...connection };
    set(c, 'clientCert.key', new TextEncoder().encode(value));
    onChangeConnection(c);
  };

  const onChangeCertFile = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      saveCertText(e?.target?.result as string);
    };
    reader.readAsText(file);
  };
  const onChangeCertText = (evt: React.ChangeEvent<HTMLInputElement>) => {
    saveCertText(evt.target.value);
  };
  const onChangeKeyFile = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      saveKeyText(e?.target?.result as string);
    };
    reader.readAsText(file);
  };
  const onChangeKeyText = (evt: React.ChangeEvent<HTMLInputElement>) => {
    saveCertText(evt.target.value);
  };
  const onDeleteCert = () => {
    onChangeConnection({ ...connection, clientCert: undefined });
    setShowCertInput(true);
  };

  return (
    <>
      {showCertInput && (
        <Grid item xs={12}>
          <label htmlFor="cert-file">
            <input
              style={{ display: 'none' }}
              id="cert-file"
              type="file"
              onChange={onChangeCertFile}
            />
            <Button variant="contained" color="primary" component="span">
              Client Certificate from File
            </Button>
          </label>
        </Grid>
      )}
      {showCertInput && (
        <Grid item xs={12}>
          <Typography variant="body2">Client Certificate Text</Typography>
          <TextArea
            fullWidth
            variant="filled"
            value={certText}
            multiline
            required={!!keyText}
            rows={5}
            placeholder="e.g. copy/paste the cert in PEM format"
            onChange={onChangeCertText}
            spellCheck={false}
          />
          <FormHelperText sx={{ pl: 2 }}>
            Add a Client Certificate with the File Selector or Copy/Paste to the
            Text Area. Key is required if the Certificate is present.
          </FormHelperText>
        </Grid>
      )}
      {showCertInput && (
        <Grid item xs={12}>
          <label htmlFor="key-file">
            <input
              style={{ display: 'none' }}
              id="key-file"
              type="file"
              onChange={onChangeKeyFile}
            />
            <Button variant="contained" color="primary" component="span">
              Client Certificate Key from File
            </Button>
          </label>
        </Grid>
      )}
      {showCertInput && (
        <Grid item xs={12}>
          <Typography variant="body2">Client Certificate Key Text</Typography>
          <TextArea
            fullWidth
            variant="filled"
            value={keyText}
            required={!!certText}
            multiline
            rows={5}
            placeholder="e.g. copy/paste the key in PEM format"
            onChange={onChangeKeyText}
          />
          <FormHelperText sx={{ pl: 2 }}>
            Add a Client Certificate Key with the File Selector or Copy/Paste to
            the Text Area. Certificate is required if the Key is present.
          </FormHelperText>
        </Grid>
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
            onClick={onDeleteCert}
            color="primary"
            size="large"
          >
            <Trash />
          </IconButton>
        </Grid>
      )}
    </>
  );
};
export default ManualClientCertSelection;
