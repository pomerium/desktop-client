import { AppBar, Grid, IconButton, Toolbar } from '@material-ui/core';

import React from 'react';

import { Search } from 'react-feather';
import Logo from './Logo';

const TopBar = (): JSX.Element => {
  return (
    <AppBar position="sticky">
      <Toolbar>
        <Grid container alignItems="center">
          <Grid item xs={11}>
            <Logo />
          </Grid>
          <Grid item xs={1}>
            <IconButton>
              <Search color={'white'} />
            </IconButton>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
};
export default TopBar;
