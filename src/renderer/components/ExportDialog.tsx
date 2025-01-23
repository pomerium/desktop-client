/* eslint no-unused-vars: off */
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import React, { ReactElement, useState } from 'react';

import { EXPORT, ExportFile } from '../../shared/constants';

export type IpcRendererEventListener = (
  event: IpcRendererEvent,
  ...args: any[]
) => void;

type ExportDialogProps = {
  onClose: () => void;
  exportFile: ExportFile | null;
};
function ExportDialog({
  onClose,
  exportFile,
}: ExportDialogProps): ReactElement {
  const [includeTags, setIncludeTags] = useState(false);
  const handleClickCancel = (evt: React.MouseEvent): void => {
    evt.preventDefault();
    onClose();
  };

  const handleClickConfirm = (evt: React.MouseEvent): void => {
    evt.preventDefault();
    ipcRenderer.send(EXPORT, { ...exportFile, includeTags });
    onClose();
  };

  return (
    <Dialog
      open={!!exportFile}
      onClose={onClose}
      scroll="paper"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        <Typography component="span" variant="h4">
          Export
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeTags}
                onChange={(evt) => setIncludeTags(evt.target.checked)}
              />
            }
            label="Include Tags"
          />
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClickCancel}>Cancel</Button>
        <Button color="primary" onClick={handleClickConfirm}>
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export default ExportDialog;
