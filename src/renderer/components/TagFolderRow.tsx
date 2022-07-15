import * as React from 'react';
import { PropsWithChildren } from 'react';
import {
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { MoreVertical } from 'react-feather';
import { ipcRenderer } from 'electron';
import {
  CONNECT_ALL,
  DELETE_ALL,
  DISCONNECT_ALL,
  EXPORT,
  ExportFile,
  UPDATE_LISTENERS,
} from '../../shared/constants';
import ClosedFolder from '../icons/ClosedFolder';
import OpenFolder from '../icons/OpenFolder';
import { ListenerUpdateRequest, Selector } from '../../shared/pb/api';
import ConfirmationDialog, {
  ConfirmationDialogProps,
} from './ConfirmationDialog';
import ExportDialog from './ExportDialog';

type FolderProps = {
  folderName: string;
  totalListeners: number;
  connectedListeners: number;
  connectionIds: string[];
  children: React.ReactNode;
};

const TagFolderRow: React.FC<FolderProps> = ({
  folderName,
  totalListeners,
  connectedListeners,
  connectionIds,
  children,
}: PropsWithChildren<FolderProps>): JSX.Element => {
  const [open, setOpen] = React.useState<boolean>(false);
  const [confirmation, setConfirmation] =
    React.useState<ConfirmationDialogProps | null>(null);
  const [exportFile, setExportFile] = React.useState<ExportFile | null>(null);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const toggleMenu = (e) => {
    setMenuAnchor(e.currentTarget);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleMenuClick = (action: string) => {
    setMenuAnchor(null);
    switch (action) {
      case CONNECT_ALL:
      case DISCONNECT_ALL:
        ipcRenderer.send(UPDATE_LISTENERS, {
          connectionIds,
          connected: action === CONNECT_ALL,
        } as ListenerUpdateRequest);
        break;
      case EXPORT:
        setExportFile({
          filename: folderName,
          selector: {
            all: false,
            ids: [],
            tags: [folderName],
          } as Selector,
        });
        break;
      default:
        ipcRenderer.send(action, folderName);
    }
  };

  return (
    <>
      {confirmation && (
        <ConfirmationDialog
          title={confirmation.title}
          text={confirmation.text}
          onConfirm={confirmation.onConfirm}
          onClose={confirmation.onClose}
        />
      )}
      <ExportDialog
        exportFile={exportFile}
        onClose={() => setExportFile(null)}
      />
      <Grid container>
        <Grid container item xs={12} alignItems="center">
          <Grid item xs={1}>
            <IconButton
              key={'menuButton' + folderName}
              aria-label={'toggle listeners for ' + folderName}
              component="span"
              onClick={toggleOpen}
              size="large"
            >
              {open ? <OpenFolder /> : <ClosedFolder />}
            </IconButton>
          </Grid>
          <Grid item xs={3} onClick={toggleOpen}>
            <Typography variant="h6">{folderName}</Typography>
          </Grid>
          <Grid container item xs={5} onClick={toggleOpen}>
            &nbsp;
          </Grid>
          <Grid
            container
            item
            xs={2}
            justifyContent="flex-end"
            onClick={toggleOpen}
          >
            <Typography variant="subtitle2">
              {connectedListeners} of {totalListeners} listening
            </Typography>
          </Grid>
          <Grid container item xs={1} justifyContent="center">
            <IconButton
              aria-controls="folder-menu"
              aria-haspopup="true"
              onClick={toggleMenu}
              aria-label={'Menu for folder: ' + folderName}
              size="large"
            >
              <MoreVertical />
            </IconButton>
            <Menu
              id={'folder-menu' + folderName}
              anchorEl={menuAnchor}
              keepMounted
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
            >
              <MenuItem
                key={CONNECT_ALL}
                onClick={() => handleMenuClick(CONNECT_ALL)}
              >
                Connect All
              </MenuItem>
              <MenuItem
                key={DISCONNECT_ALL}
                onClick={() => handleMenuClick(DISCONNECT_ALL)}
              >
                Disconnect All
              </MenuItem>
              <MenuItem key={EXPORT} onClick={() => handleMenuClick(EXPORT)}>
                Export
              </MenuItem>
              <MenuItem
                key={DELETE_ALL}
                onClick={() => {
                  setConfirmation({
                    title: 'Delete connections?',
                    text: `All connections with tag ${folderName} will be deleted.`,
                    onClose: () => setConfirmation(null),
                    onConfirm: () => {
                      setConfirmation(null);
                      handleMenuClick(DELETE_ALL);
                    },
                  });
                }}
              >
                Delete
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={12}>
            <Divider />
          </Grid>
        </Grid>
        {open && children}
      </Grid>
    </>
  );
};

export default TagFolderRow;
