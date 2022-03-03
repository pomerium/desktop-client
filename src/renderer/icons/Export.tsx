import React from 'react';
import { SvgIcon } from '@mui/material';

import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles(() => ({
  iconStyle: {
    height: '20px',
    width: '20px',
  },
}));

const Export = (): JSX.Element => {
  const classes = useStyles();
  return (
    <SvgIcon viewBox="0 0 20 20" className={classes.iconStyle}>
      <path
        d="M15.8333 15.8333H4.16667V4.16667H10V2.5H4.16667C3.24167 2.5 2.5 3.25 2.5 4.16667V15.8333C2.5 16.75 3.24167 17.5 4.16667 17.5H15.8333C16.75 17.5 17.5 16.75 17.5 15.8333V10H15.8333V15.8333ZM11.6667 2.5V4.16667H14.6583L6.46667 12.3583L7.64167 13.5333L15.8333 5.34167V8.33333H17.5V2.5H11.6667Z"
        fill="#6F43E7"
      />
    </SvgIcon>
  );
};
export default Export;
