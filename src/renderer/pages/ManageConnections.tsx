import React, { useEffect } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Container,
  Grid,
  makeStyles,
  Typography,
} from '@material-ui/core';
import Card from '../components/Card';
import { ChevronDown, Download, Plus } from 'react-feather';
import { Theme } from '../../shared/theme';
import { Link } from 'react-router-dom';

const useStyles = makeStyles((theme: Theme) => ({
  titleGrid: {
    paddingTop: theme.spacing(4),
  },
  accordion: {
    backgroundColor: theme.palette.background.paper,
    marginTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    borderRadius: '16px',
    '&:before': {
      display: 'none',
    },
  },
}));

const ManageConnections = (): JSX.Element => {
  const classes = useStyles();

  useEffect(() => {}, []);

  return (
    <Container maxWidth={false}>
      <Grid className={classes.titleGrid}>
        <Grid container alignItems="flex-start">
          <Grid item xs={6}>
            <Typography variant="h3" color="textPrimary">
              Manage Connections
            </Typography>
          </Grid>
          <Grid item xs={6} container justify="flex-end">
            <Grid item>
              <Button
                type="button"
                color="primary"
                onClick={() => alert('todo')}
                endIcon={<Download />}
              >
                Import
              </Button>
            </Grid>
            <Grid item xs={1} />
            <Grid item>
              <Button
                type="button"
                variant="contained"
                component={Link}
                to={'/connectForm'}
                color="primary"
                endIcon={<Plus />}
              >
                New Connection
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Card>
        <Accordion className={classes.accordion} square={true}>
          <AccordionSummary
            expandIcon={<ChevronDown />}
            aria-controls="advanced-settings-content"
            id="advanced-settings-header"
          >
            <Typography variant={'h5'}>Advanced Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>hello</AccordionDetails>
        </Accordion>
      </Card>
    </Container>
  );
};
export default ManageConnections;
