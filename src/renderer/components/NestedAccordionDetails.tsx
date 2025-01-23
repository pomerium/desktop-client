import { AccordionDetails, styled } from '@mui/material';

const NestedAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
}));
export default NestedAccordionDetails;
