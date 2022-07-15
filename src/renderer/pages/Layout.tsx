import React, { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import TopBar from '../components/TopBar';

const Layout: FC = () => {
  return (
    <>
      <TopBar />
      <Outlet />
      <Box mt={3} flexGrow={1} />
    </>
  );
};

export default Layout;
