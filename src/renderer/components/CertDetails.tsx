import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import moment from 'moment';
import React from 'react';

import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { Certificate } from '../../shared/pb/api';
import { Theme } from '../../shared/theme';

const useStyles = makeStyles((theme: Theme) => ({
  item: {
    padding: 0,
  },
  red: {
    color: 'red',
  },
  black: {
    color: theme.palette.text.primary,
  },
  bold: {
    fontWeight: 'bold',
  },
}));

interface DetailViewDialogProps {
  open: boolean;
  onClose: () => void;
  certInfo: Certificate['info'];
}

interface DataPointProps {
  title;
}

const DataPoint = ({
  children,
  title,
}: React.PropsWithChildren<DataPointProps>) => {
  const classes = useStyles();

  return (
    <Grid container alignItems="stretch" spacing={1}>
      <Grid item xs={4}>
        <Typography className={classes.bold} variant="h6">
          {title}
        </Typography>
      </Grid>
      <Grid item xs={8}>
        {children}
      </Grid>
    </Grid>
  );
};

const DetailViewDialog = ({
  open,
  onClose,
  certInfo,
}: DetailViewDialogProps): JSX.Element => {
  const classes = useStyles();

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
            <List classes={{ root: classes.item }}>
              {certInfo?.issuer?.organization?.map((org) => (
                <ListItem key={org} classes={{ root: classes.item }}>
                  <Typography>{org}</Typography>
                </ListItem>
              ))}
            </List>
          </DataPoint>
          <DataPoint title="Subject">
            <List classes={{ root: classes.item }}>
              {certInfo?.subject?.organization?.map((org) => (
                <ListItem key={org} classes={{ root: classes.item }}>
                  <Typography>{org}</Typography>
                </ListItem>
              ))}
            </List>
          </DataPoint>
          <DataPoint title="DNS Names">
            <List classes={{ root: classes.item }}>
              {certInfo?.dnsNames?.map((dns_name) => (
                <ListItem key={dns_name} classes={{ root: classes.item }}>
                  <Typography>{dns_name}</Typography>
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
};
export default DetailViewDialog;
