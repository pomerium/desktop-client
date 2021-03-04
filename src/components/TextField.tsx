/* eslint-disable react/jsx-props-no-spreading */
import {
  makeStyles,
  TextField as MuiTextField,
  TextFieldProps,
} from '@material-ui/core';
import React from 'react';

import { Theme } from '../utils/theme';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    '& .Mui-focused': {},
    '& .MuiInputBase-input': {
      padding: theme.spacing(1),
      backgroundColor: theme.palette.background.dark,
    },
    '& .Mui-error .MuiInputBase-input': {
      backgroundColor: theme.palette.error.main,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderWidth: '0px',
    },
    '& .MuiInputLabel-outlined:not(.MuiInputLabel-shrink)': {
      transform: 'translate(8px, 10px) scale(1)',
    },
    boxShadow: theme.shadows[1],
    borderRadius: '2px',
  },
}));

const TextField = (props: TextFieldProps): JSX.Element => {
  const classes = useStyles();
  return (
    <MuiTextField
      {...props} //
      variant="outlined"
      size="small"
      color="primary"
      className={classes.root}
    />
  );
};
export default TextField;
