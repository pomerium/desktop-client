/* eslint-disable react/jsx-props-no-spreading */
import { TextField as MuiTextField, TextFieldProps } from '@mui/material';
import React from 'react';

const TextField = (props: TextFieldProps): JSX.Element => {
  return (
    <MuiTextField {...props} variant="outlined" size="small" color="primary" />
  );
};
export default TextField;
