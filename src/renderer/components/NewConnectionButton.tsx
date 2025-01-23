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
} from '@mui/material';
import React, { FC, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { usePopover } from '../hooks/use-popover';

const NewConnectionButton: FC = () => {
  const popover = usePopover<HTMLButtonElement>();
  const navigate = useNavigate();
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    popover.handleClose();
  };

  const handleMenuItemClick = (key: string) => {
    popover.handleClose();
    switch (key) {
      case 'load':
        navigate(`/loadForm`, {
          replace: true,
        });
        break;
      case 'add':
        navigate(`/connectForm`, {
          replace: true,
        });
        break;
    }
  };

  const options = [
    {
      key: 'load',
      title: 'Load Connections',
    },
    {
      key: 'add',
      title: 'Add Connecton',
    },
  ];

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        ref={popover.anchorRef}
        onClick={popover.handleOpen}
        startIcon={<AddCircleOutlineIcon />}
      >
        <Typography variant="button">New Connection</Typography>
      </Button>
      <Popper
        sx={{ zIndex: 1 }}
        open={popover.open}
        anchorEl={popover.anchorRef.current}
        role={undefined}
        transition
        disablePortal
        placement="bottom-end"
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem disablePadding>
                  {options.map((option) => (
                    <MenuItem
                      key={option.key}
                      onClick={(_event) => handleMenuItemClick(option.key)}
                      sx={{ borderRadius: 1 }}
                      divider={true}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
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
