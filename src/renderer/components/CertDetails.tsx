import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import moment from 'moment';
import React, { ReactElement } from 'react';

import { Certificate } from '../../shared/pb/api';

interface DetailViewDialogProps {
  open: boolean;
  onClose: () => void;
  certInfo: Certificate['info'];
}

interface DataPointProps {
  title;
}

function DataPoint({
  children,
  title,
}: React.PropsWithChildren<DataPointProps>) {
  return (
    <Grid container alignItems="stretch" spacing={1}>
      <Grid item xs={4}>
        <Typography sx={{ fontWeight: 'bold' }} variant="h6">
          {title}
        </Typography>
      </Grid>
      <Grid item xs={8}>
        {children}
      </Grid>
    </Grid>
  );
}

function DetailViewDialog({
  open,
  onClose,
  certInfo,
}: DetailViewDialogProps): ReactElement {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h4">Cert Details</Typography>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Container disableGutters>
          <DataPoint title="Serial">
            <Typography>{certInfo?.serial}</Typography>
          </DataPoint>
          <DataPoint title="Issuer">
            <List sx={{ padding: 0 }}>
              {certInfo?.issuer?.organization?.map((org) => (
                <ListItem key={org} sx={{ padding: 0 }}>
                  <Typography>{org}</Typography>
                </ListItem>
              ))}
            </List>
          </DataPoint>
          <DataPoint title="Subject">
            <List sx={{ padding: 0 }}>
              {certInfo?.subject?.organization?.map((org) => (
                <ListItem key={org} sx={{ padding: 0 }}>
                  <Typography>{org}</Typography>
                </ListItem>
              ))}
            </List>
          </DataPoint>
          <DataPoint title="DNS Names">
            <List sx={{ padding: 0 }}>
              {certInfo?.dnsNames?.map((dnsName) => (
                <ListItem key={dnsName} sx={{ padding: 0 }}>
                  <Typography>{dnsName}</Typography>
                </ListItem>
              ))}
            </List>
          </DataPoint>
          <DataPoint title="Expires">
            <Typography>{moment(certInfo?.notAfter).format('LLLL')}</Typography>
          </DataPoint>
        </Container>
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export default DetailViewDialog;
