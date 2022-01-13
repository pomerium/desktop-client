import * as React from 'react';
import { Typography, Grid, IconButton, Divider } from '@material-ui/core';
import { PropsWithChildren } from 'react';
import VirtualClosedFolder from '../icons/VirtualClosedFolder';
import VirtualOpenFolder from '../icons/VirtualOpenFolder';

type VirtualFolderProps = {
  folderName: string;
  totalListeners: number;
  connectedListeners: number;
};

const VirtualFolderRow: React.FC<VirtualFolderProps> = ({
  folderName,
  totalListeners,
  connectedListeners,
  children,
}: PropsWithChildren<VirtualFolderProps>): JSX.Element => {
  const [open, setOpen] = React.useState<boolean>(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  return (
    <Grid container>
      <Grid container item xs={12} alignItems="center">
        <Grid item xs={1}>
          <IconButton
            key={'menuButton' + folderName}
            aria-label={'toggle listeners for ' + folderName}
            component="span"
            onClick={toggleOpen}
          >
            {open ? <VirtualOpenFolder /> : <VirtualClosedFolder />}
          </IconButton>
        </Grid>
        <Grid item xs={3} onClick={toggleOpen}>
          <Typography variant="h6">{folderName}</Typography>
        </Grid>
        <Grid item xs={5} onClick={toggleOpen} />
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
        <Grid item xs={1} />
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
