import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import {
  Button,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  Typography,
} from "@mui/material";
import React, { FC } from "react";
import { useNavigate } from "react-router-dom";

import usePopover from "../hooks/use-popover";

const NewConnectionButton: FC = () => {
  const { anchorEl, setAnchorEl, open, handleOpen, handleClose } = usePopover<HTMLButtonElement>();
  const navigate = useNavigate();

  const handleClickAway = (event: Event) => {
    if (anchorEl?.contains(event.target as HTMLElement)) {
      return;
    }
    handleClose();
  };

  const handleMenuItemClick = (key: string) => {
    handleClose();
    switch (key) {
      case "load":
        navigate(`/loadForm`, {
          replace: true,
        });
        break;
      case "add":
        navigate(`/connectForm`, {
          replace: true,
        });
        break;
      default:
        break;
    }
  };

  const options = [
    {
      key: "load",
      title: "Load Connections",
    },
    {
      key: "add",
      title: "Add Connecton",
    },
  ];

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        ref={setAnchorEl}
        onClick={handleOpen}
        startIcon={<AddCircleOutlineIcon />}
      >
        <Typography variant="button">New Connection</Typography>
      </Button>
      <Popper
        sx={{ zIndex: 1 }}
        open={open}
        anchorEl={anchorEl}
        role={undefined}
        transition
        disablePortal
        placement="bottom-end"
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClickAway}>
                <MenuList id="split-button-menu" autoFocusItem disablePadding>
                  {options.map((option) => (
                    <MenuItem
                      key={option.key}
                      onClick={() => handleMenuItemClick(option.key)}
                      sx={{ borderRadius: 1 }}
                      divider
                    >
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Typography variant="button">{option.title}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default NewConnectionButton;
