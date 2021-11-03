import React from 'react';
import { makeStyles, SvgIcon } from '@material-ui/core';

const useStyles = makeStyles(() => ({
  iconStyle: {
    height: '20px',
    width: '20px',
  },
}));

const OpenFolder = (): JSX.Element => {
  const classes = useStyles();
  return (
    <SvgIcon viewBox="0 0 20 20" className={classes.iconStyle}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 6C2 5.46957 2.21071 4.96086 2.58579 4.58579C2.96086 4.21071 3.46957 4 4 4H8L10 6H14C14.5304 6 15.0391 6.21071 15.4142 6.58579C15.7893 6.96086 16 7.46957 16 8V9H8C7.20435 9 6.44129 9.31607 5.87868 9.87868C5.31607 10.4413 5 11.2044 5 12V13.5C5 13.8978 4.84196 14.2794 4.56066 14.5607C4.27936 14.842 3.89782 15 3.5 15C3.10218 15 2.72064 14.842 2.43934 14.5607C2.15804 14.2794 2 13.8978 2 13.5V6Z"
        fill="#2196F3"
      />
      <path
        d="M6 12C6 11.4696 6.21071 10.9609 6.58579 10.5858C6.96086 10.2107 7.46957 10 8 10H16C16.5304 10 17.0391 10.2107 17.4142 10.5858C17.7893 10.9609 18 11.4696 18 12V14C18 14.5304 17.7893 15.0391 17.4142 15.4142C17.0391 15.7893 16.5304 16 16 16H2H4C4.53043 16 5.03914 15.7893 5.41421 15.4142C5.78929 15.0391 6 14.5304 6 14V12Z"
        fill="#2196F3"
      />
    </SvgIcon>
  );
};
export default OpenFolder;