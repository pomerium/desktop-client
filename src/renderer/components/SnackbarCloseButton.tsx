import { IconButton } from '@mui/material';
import { useSnackbar, SnackbarKey } from 'notistack';
import * as React from 'react';
import { XCircle } from 'react-feather';

type SnackbarCloseProps = {
  snackbarKey: SnackbarKey;
};

function SnackbarCloseButton({ snackbarKey }: SnackbarCloseProps) {
  const { closeSnackbar } = useSnackbar();

  return (
    <IconButton
      onClick={() => closeSnackbar(snackbarKey)}
      color="secondary"
      size="large"
    >
      <XCircle />
    </IconButton>
  );
}

export default SnackbarCloseButton;
