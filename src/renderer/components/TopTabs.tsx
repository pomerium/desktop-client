import {
  AppBar,
  Grid,
  makeStyles,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from '@material-ui/core';
import React from 'react';
import { Link } from 'react-router-dom';
import { desktopVersion, cliVersion, gitHash } from '../../meta.json';

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
    <AppBar position="sticky" color="secondary" className={classes.root}>
      <Toolbar disableGutters>
        <Grid container alignItems="center">
          <Grid item xs={8}>
            <Tabs value="/manage" indicatorColor="primary" textColor="primary">
              <Tab
                label="MANAGE CONNECTIONS"
                to="/manage"
                value="/manage"
                component={Link}
              />
            </Tabs>
          </Grid>
          <Grid item xs={4}>
            <Grid container>
              <Grid item xs={11}>
                <Typography align="right" variant="subtitle2">
                  Version: {desktopVersion}-{gitHash}
                </Typography>
                <Typography align="right" variant="subtitle2">
                  CLI Version: {cliVersion}
                </Typography>
              </Grid>
              <Grid item xs={11} />
            </Grid>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
};
export default TopTabs;
