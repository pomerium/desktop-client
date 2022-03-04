import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import React from 'react';
import { ipcRenderer } from 'electron';
import { VIEW_CONNECTION_LIST } from '../../shared/constants';

interface Props {
  open: boolean;
  onClose(): void;
}

const BeforeBackActionDialog = ({ open, onClose }: Props): JSX.Element => {
  const handleClickCancel = (evt: React.MouseEvent): void => {
    evt.preventDefault();
    onClose();
  };

  const handleClickConfirm = (evt: React.MouseEvent): void => {
    evt.preventDefault();
    ipcRenderer.send(VIEW_CONNECTION_LIST);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h4">Go Back?</Typography>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Typography variant="h6">
          You have unsaved changes which will be lost if you leave this page.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClickCancel}>Cancel</Button>
        <Button color="primary" onClick={handleClickConfirm}>
          Back
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default BeforeBackActionDialog;
