import { IconButton } from '@material-ui/core';
import { useSnackbar, SnackbarKey } from 'notistack';
import * as React from 'react';
import { XCircle } from 'react-feather';

type SnackbarCloseProps = {
  snackbarKey: SnackbarKey;
};

function SnackbarCloseButton({ snackbarKey }: SnackbarCloseProps) {
  const { closeSnackbar } = useSnackbar();

  return (
    <IconButton onClick={() => closeSnackbar(snackbarKey)} color="secondary">
      <XCircle />
    </IconButton>
  );
}

export default SnackbarCloseButton;
