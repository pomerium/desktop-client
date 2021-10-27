import { AppBar, Grid, IconButton, Toolbar } from '@material-ui/core';

import React, { FC } from 'react';

import { Search } from 'react-feather';
import Logo from '../icons/Logo';

const TopBar: FC = ({ children }): JSX.Element => {
  return (
    <AppBar position="sticky">
      <Toolbar>
        <Grid container alignItems="center">
          <Grid item xs={11}>
            <Logo />
          </Grid>
          <Grid item xs={1}>
            <IconButton>
              <Search color="white" />
            </IconButton>
          </Grid>
        </Grid>
      </Toolbar>
      {children}
    </AppBar>
  );
};
export default TopBar;
