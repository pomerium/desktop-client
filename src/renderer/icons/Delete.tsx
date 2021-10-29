import React from 'react';
import { makeStyles, SvgIcon } from '@material-ui/core';

const useStyles = makeStyles(() => ({
  iconStyle: {
    height: '20px',
    width: '20px',
  },
}));

const Delete = (): JSX.Element => {
  const classes = useStyles();
  return (
    <SvgIcon viewBox="0 0 20 20" className={classes.iconStyle}>
      <path
        d="M4.99984 15.8333C4.99984 16.75 5.74984 17.5 6.6665 17.5H13.3332C14.2498 17.5 14.9998 16.75 14.9998 15.8333V5.83333H4.99984V15.8333ZM15.8332 3.33333H12.9165L12.0832 2.5H7.9165L7.08317 3.33333H4.1665V5H15.8332V3.33333Z"
        fill="#6F43E7"
      />
    </SvgIcon>
  );
};
export default Delete;
