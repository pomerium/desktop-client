import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';
import React, { FC } from 'react';
import { ChevronDown } from 'react-feather';

export type AdvancedSettingsAccordionProps = React.PropsWithChildren;
const AdvancedSettingsAccordion: FC<AdvancedSettingsAccordionProps> = ({
  children,
}) => {
  return (
    <Accordion
      sx={{
        backgroundColor: 'background.paper',
        marginTop: 2,
        paddingLeft: 2,
        paddingRight: 2,
        borderRadius: 4,
        '&:before': {
          display: 'none',
        },
      }}
      square={false}
    >
      <AccordionSummary
        expandIcon={<ChevronDown />}
        aria-controls="advanced-settings-content"
        id="advanced-settings-header"
      >
        <Typography variant="h5">Advanced Settings</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};
export default AdvancedSettingsAccordion;
