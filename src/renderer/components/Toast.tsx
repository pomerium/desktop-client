import * as React from 'react';
import { Box, Collapse, IconButton } from '@material-ui/core';
import { Alert, Color } from '@material-ui/lab';
import { X } from 'react-feather';
import { useEffect, useRef, useState } from 'react';
import { TOAST_LENGTH } from '../../shared/constants';

type ToastProps = {
  msg: string;
  alertType: Color | undefined;
};

const Toast = ({ msg, alertType }: ToastProps) => {
  const [open, setOpen] = useState(true);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;

    setTimeout(() => {
      if (mounted.current) {
        setOpen(false);
      }
    }, TOAST_LENGTH);

    return () => {
      mounted.current = false;
    };
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
