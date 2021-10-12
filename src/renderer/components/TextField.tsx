/* eslint-disable react/jsx-props-no-spreading */
import {
  makeStyles,
  TextField as MuiTextField,
  TextFieldProps,
} from '@material-ui/core';
import React from 'react';

import { Theme } from '../../shared/theme';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    '& .Mui-focused': {},
    '& .MuiInputBase-input': {
      backgroundColor: theme.palette.background.dark,
    },
    '& .Mui-error .MuiInputBase-input': {
      backgroundColor: theme.palette.error.main,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderWidth: '1px',
      borderColor: theme.palette.divider,
    },
    '& .MuiInputLabel-outlined:not(.MuiInputLabel-shrink)': {
      transform: 'translate(8px, 10px) scale(1)',
    },
    borderRadius: '2px',
    '& .Mui-disabled': {
      background: '#cfcfcf',
    },
    '& div.MuiOutlinedInput-root': {
      background: theme.palette.background.dark,
    },
    '& div.MuiOutlinedInput-underline:before': {
      borderBottom: `0px`,
    },
    '& div.MuiOutlinedInput-underline:after': {
      border: `0px`,
    },
  },
}));

const TextField = (props: TextFieldProps): JSX.Element => {
  const classes = useStyles();
  return (
    <MuiTextField
      {...props}
      variant="outlined"
      size="small"
      color="primary"
      className={classes.root}
    />
  );
};
export default TextField;
