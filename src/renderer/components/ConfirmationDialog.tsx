import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import React, { FC, ReactElement } from 'react';

export interface ConfirmationDialogProps {
  title: string;
  text: string;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmationDialog: FC<ConfirmationDialogProps> = ({
  title,
  text,
  onConfirm,
  onClose,
}: ConfirmationDialogProps): ReactElement => (
  <Dialog open onClose={onClose}>
    <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
        {text}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} autoFocus>
        OK
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmationDialog;
