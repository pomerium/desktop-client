import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@material-ui/core';
import React, { FC } from 'react';

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
}) => {
  return (
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
};

export default ConfirmationDialog;
