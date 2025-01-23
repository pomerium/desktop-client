import { Button, FormHelperText, Grid, Typography } from '@mui/material';
import React, { FC, useState } from 'react';
import TextArea from './TextArea';

export type ManualClientCertSelectionProps = {
  onChangeCert: (cert: string) => void;
  onChangeKey: (key: string) => void;
};

const ManualClientCertSelection: FC<ManualClientCertSelectionProps> = ({
  onChangeCert,
  onChangeKey,
}) => {
  const [certText, setCertText] = useState('');
  const [keyText, setKeyText] = useState('');

  const handleCertText = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setCertText(evt.target.value);
    onChangeCert(evt.target.value);
  };

  const handleKeyText = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setKeyText(evt.target.value);
    onChangeKey(evt.target.value);
  };

  const handleCertFile = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCertText(e?.target?.result as string);
        onChangeCert(e?.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleKeyFile = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setKeyText(e?.target?.result as string);
        onChangeKey(e?.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <Grid item xs={12}>
        <label htmlFor="cert-file">
          <input
            style={{ display: 'none' }}
            id="cert-file"
            type="file"
            onChange={handleCertFile}
          />
          <Button variant="contained" color="primary" component="span">
            Client Certificate from File
          </Button>
        </label>
      </Grid>
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
          onChange={handleCertText}
          spellCheck={false}
        />
        <FormHelperText sx={{ pl: 2 }}>
          Add a Client Certificate with the File Selector or Copy/Paste to the
          Text Area. Key is required if the Certificate is present.
        </FormHelperText>
      </Grid>
      <Grid item xs={12}>
        <label htmlFor="key-file">
          <input
            style={{ display: 'none' }}
            id="key-file"
            type="file"
            onChange={handleKeyFile}
          />
          <Button variant="contained" color="primary" component="span">
            Client Certificate Key from File
          </Button>
        </label>
      </Grid>
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
          onChange={handleKeyText}
        />
        <FormHelperText sx={{ pl: 2 }}>
          Add a Client Certificate Key with the File Selector or Copy/Paste to
          the Text Area. Certificate is required if the Key is present.
        </FormHelperText>
      </Grid>
    </>
  );
};

export default ManualClientCertSelection;
