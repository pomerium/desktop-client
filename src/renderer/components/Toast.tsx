import * as React from 'react';
import { Box, Collapse, IconButton } from '@material-ui/core';
import { Alert, Color } from '@material-ui/lab';
import { X } from 'react-feather';
import { useEffect, useState } from 'react';

type ToastProps = {
  msg: string;
  alertType: Color | undefined;
};

const Toast = ({ msg, alertType }: ToastProps) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setOpen(false);
    }, 6000);
  }, []);

  return (
    <Box sx={{ width: '100%' }} mt={open ? 1 : 0}>
      <Collapse in={open}>
        <Alert
          severity={alertType}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setOpen(false);
              }}
            >
              <X />
            </IconButton>
          }
        >
          {msg}
        </Alert>
      </Collapse>
    </Box>
  );
};

export default Toast;
