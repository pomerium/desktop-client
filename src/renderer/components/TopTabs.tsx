import { AppBar, Grid, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import { ReactElement } from "react";
import { Link } from "react-router-dom";

import metadata from "../../meta.json";

function TopTabs(): ReactElement {
  return (
    <AppBar
      position="sticky"
      color="secondary"
      sx={{
        "& .MuiToolbar-regular": {
          minHeight: 0,
        },
      }}
    >
      <Toolbar disableGutters>
        <Grid container sx={{ width: "100%", alignItems: "center" }}>
          <Grid size={8}>
            <Tabs value="/manage" indicatorColor="primary" textColor="primary">
              <Tab label="MANAGE CONNECTIONS" to="/manage" value="/manage" component={Link} />
            </Tabs>
          </Grid>
          <Grid size={4}>
            <Grid container>
              <Grid size={11}>
                <Typography align="right" variant="subtitle2" sx={{ pt: 0.5 }}>
                  Version: {metadata.desktopVersion}-{metadata.gitHash}
                </Typography>
                <Typography align="right" variant="subtitle2">
                  CLI Version: {metadata.cliVersion}
                </Typography>
              </Grid>
              <Grid size={11} />
            </Grid>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
}
export default TopTabs;
