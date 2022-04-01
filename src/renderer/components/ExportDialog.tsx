import { ipcRenderer, IpcRendererEvent } from 'electron';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import React, { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useSnackbar } from 'notistack';

import { EXPORT, ExportFile, TOAST_LENGTH } from '../../shared/constants';

type IpcRendererEventListener = (
  event: IpcRendererEvent,
  ...args: any[]
) => void;

type ExportDialogProps = {
  onClose: () => void;
  exportFile: ExportFile | null;
};
const ExportDialog = ({
  onClose,
  exportFile,
}: ExportDialogProps): JSX.Element => {
  const { enqueueSnackbar } = useSnackbar();
  const [includeTags, setIncludeTags] = useState(false);

  useEffect(() => {
    const listener: IpcRendererEventListener = (_, args) => {
      if (args.err) {
        enqueueSnackbar(args.err.message, {
          variant: 'error',
          autoHideDuration: TOAST_LENGTH,
        });
      } else {
        const blob = new Blob([args.data], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = args.filename.replace(/\s+/g, '_') + '.json';
        link.click();
      }
    };
    ipcRenderer.on(EXPORT, listener);
    return () => {
      ipcRenderer.removeListener(EXPORT, listener);
    };
  }, []);

  const handleClickCancel = (evt: React.MouseEvent): void => {
    evt.preventDefault();
    onClose();
  };

  const handleClickConfirm = (evt: React.MouseEvent): void => {
    evt.preventDefault();
    ipcRenderer.send(EXPORT, { ...exportFile, includeTags });
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
};
export default ExportDialog;
