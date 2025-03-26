/* eslint-disable react/jsx-props-no-spreading */
import { Accordion, AccordionProps, styled } from '@mui/material';
import React from 'react';

const NestedAccordion = styled((props: AccordionProps) => (
  <Accordion disableGutters elevation={0} {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  marginLeft: theme.spacing(2),
  width: '100%',
  '&:before': {
    display: 'none',
  },
}));
export default NestedAccordion;
