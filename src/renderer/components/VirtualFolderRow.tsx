import { Typography, Grid, IconButton, Divider } from "@mui/material";
import * as React from "react";
import { PropsWithChildren, ReactElement } from "react";

import VirtualClosedFolder from "../icons/VirtualClosedFolder";
import VirtualOpenFolder from "../icons/VirtualOpenFolder";

type VirtualFolderProps = {
  folderName: string;
  totalListeners: number;
  connectedListeners: number;
  children: React.ReactNode;
};

const VirtualFolderRow: React.FC<VirtualFolderProps> = ({
  folderName,
  totalListeners,
  connectedListeners,
  children,
}: PropsWithChildren<VirtualFolderProps>): ReactElement => {
  const [open, setOpen] = React.useState<boolean>(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  return (
    <Grid container sx={{ width: "100%" }}>
      <Grid container size={12} sx={{ alignItems: "center" }}>
        <Grid size={1}>
          <IconButton
            key={"menuButton" + folderName}
            aria-label={"toggle listeners for " + folderName}
            component="span"
            onClick={toggleOpen}
            size="large"
          >
            {open ? <VirtualOpenFolder /> : <VirtualClosedFolder />}
          </IconButton>
        </Grid>
        <Grid size={3} onClick={toggleOpen}>
          <Typography variant="h6">{folderName}</Typography>
        </Grid>
        <Grid container size={5} onClick={toggleOpen}>
          &nbsp;
        </Grid>
        <Grid container size={2} onClick={toggleOpen} sx={{ justifyContent: "flex-end" }}>
          <Typography variant="subtitle2">
            {connectedListeners} of {totalListeners} listening
          </Typography>
        </Grid>
        <Grid size={1} />
      </Grid>
      <Grid container size={12}>
        <Grid size={12}>
          <Divider />
        </Grid>
      </Grid>
      {open && children}
    </Grid>
  );
};

export default VirtualFolderRow;
