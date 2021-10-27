import * as React from 'react';
import {
  Typography,
  Grid,
  IconButton,
  Divider,
  MenuItem,
  Menu,
} from '@material-ui/core';
import VirtualClosedFolder from '../icons/VirtualClosedFolder';
import VirtualOpenFolder from '../icons/VirtualOpenFolder';
import { PropsWithChildren } from 'react';
import { MoreVertical } from 'react-feather';
import { EXPORT_ALL, FolderActionData } from '../../shared/constants';
import { ipcRenderer } from 'electron';

type VirtualFolderProps = {
  folderName: string;
};

const VirtualFolderRow: React.FC<VirtualFolderProps> = ({
  folderName,
  children,
}: PropsWithChildren<VirtualFolderProps>): JSX.Element => {
  const [open, setOpen] = React.useState<boolean>(false);

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
    ipcRenderer.send(action, { folderName } as FolderActionData);
  };

  return (
    <Grid container>
      <Grid container item xs={12} alignItems="center">
        <Grid item xs={1}>
          <IconButton
            key={'menuButton' + folderName}
            aria-label={'toggle connections for ' + folderName}
            component="span"
            onClick={toggleOpen}
          >
            {open ? <VirtualOpenFolder /> : <VirtualClosedFolder />}
          </IconButton>
        </Grid>
        <Grid item xs={3}>
          <Typography variant={'h6'}>{folderName}</Typography>
        </Grid>
        <Grid item xs={5} />
        <Grid container item xs={2} justifyContent="flex-end">
          <Typography variant="subtitle2">7 of 7 connected</Typography>
        </Grid>
        <Grid container item xs={1} justifyContent="center">
          <IconButton
            aria-controls="folder-menu"
            aria-haspopup="true"
            onClick={toggleMenu}
            aria-label={'Menu for folder: ' + folderName}
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
              key={EXPORT_ALL}
              onClick={() => handleMenuClick(EXPORT_ALL)}
            >
              Export
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
  );
};

export default VirtualFolderRow;
