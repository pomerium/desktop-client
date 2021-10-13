import {
  AppBar,
  Grid,
  makeStyles,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@material-ui/core';
import { version } from '../../package.json';
import React from 'react';
import { Link } from 'react-router-dom';

const useStyles = makeStyles(() => ({
  root: {
    '& .MuiToolbar-regular': {
      minHeight: 0,
    },
  },
}));

const TopTabs = (): JSX.Element => {
  const classes = useStyles();
  return (
    <AppBar position="sticky" color={'secondary'} className={classes.root}>
      <Toolbar disableGutters>
        <Grid container alignItems="center">
          <Grid item xs={10}>
            <Tabs
              value={'/manage'}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab
                label="MANAGE CONNECTIONS"
                to="/manage"
                value="/manage"
                component={Link}
              />
            </Tabs>
          </Grid>
          <Grid item xs={2} justifyContent={'flex-end'}>
            <Typography align="center" variant={'subtitle2'}>
              Version: {version}
            </Typography>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
};
export default TopTabs;
