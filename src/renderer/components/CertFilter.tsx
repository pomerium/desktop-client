import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import React, { useEffect, useId, useRef } from 'react';

import TextField from './TextField';

interface Props {
  label: string;
  data: string | undefined;
  onChange: (filter: string | undefined) => void;
  disabled: boolean;
}

const CertFilter: React.FC<Props> = ({ label, data, onChange, disabled }) => {
  const [dataAttribute, dataValue] = (data || '').split('=', 2);
  const attribute = dataAttribute || '';
  const value = dataValue || '';

  const selectLabelId = useId();
  const selectId = useId();

  const setAttribute = (newAttribute: string) => {
    onChange(newAttribute ? newAttribute + '=' + value : undefined);
  };
  const setValue = (newValue: string) => {
    onChange(attribute + '=' + newValue);
  };

  const valueInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    valueInputRef.current?.focus();
  }, [attribute]);

  return (
    <Grid container columnSpacing={1}>
      <Grid item xs={12}>
        <Typography sx={{ py: 1 }}>{label}</Typography>
      </Grid>
      <Grid item xs={4}>
        <FormControl size="small" fullWidth disabled={disabled}>
          <InputLabel shrink id={selectLabelId}>
            Attribute
          </InputLabel>
          <Select
            labelId={selectLabelId}
            id={selectId}
            label="Attribute"
            value={attribute}
            notched
            displayEmpty
            renderValue={(selected) => selected || 'No filter'}
            onChange={(evt) => setAttribute(evt.target.value)}
            MenuProps={{ disablePortal: true }}
          >
            <MenuItem value="">No filter</MenuItem>
            <MenuItem value="CN">CN (Common Name)</MenuItem>
            <MenuItem value="O">O (Organization Name)</MenuItem>
            <MenuItem value="OU">OU (Organizational Unit Name)</MenuItem>
            <MenuItem value="C">C (Country Name)</MenuItem>
            <MenuItem value="ST">ST (State or Province Name)</MenuItem>
            <MenuItem value="L">L (Locality Name)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={8}>
        {attribute && (
          <TextField
            inputRef={valueInputRef}
            fullWidth
            label="Value"
            value={value}
            disabled={!attribute}
            onChange={(evt): void => setValue(evt.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        )}
      </Grid>
      <Grid item xs={12}>
        <FormHelperText>
          Further limits the search to certificates where the {label} has a
          particular attribute value (exact match).
        </FormHelperText>
      </Grid>
    </Grid>
  );
};

export default CertFilter;
