import { Box } from "@mui/material";
import { FC } from "react";
import { Outlet } from "react-router-dom";

import TopBar from "../components/TopBar";

const Layout: FC = () => {
  return (
    <>
      <TopBar />
      <Outlet />
      <Box sx={{ mt: 3, flexGrow: 1 }} />
    </>
  );
};

export default Layout;
