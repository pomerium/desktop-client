import {
  Grid,
  Typography,
  SvgIcon,
  Divider,
  Container,
  Tooltip,
  Box,
} from '@mui/material';
import React, { FC, ReactElement, ReactFragment, ReactNode } from 'react';
import { HelpCircle } from 'react-feather';

type FieldWrapperProps = {
  label: string;
  description: ReactFragment;
  children: ReactNode;
};

const FieldWrapper: FC<FieldWrapperProps> = ({
  label,
  description,
  children,
}: FieldWrapperProps): ReactElement => {
  return (
    <Container maxWidth={false} disableGutters sx={{ p: 2 }}>
      <Grid container sx={{ mb: 1 }}>
        <Grid
          item
          sx={{
            width: '260px',
            paddingRight: 2,
            display: `flex`,
            flexFlow: `row wrap`,
          }}
          xs={4}
        >
          <Typography variant="body1">{label}</Typography>
          <Box
            sx={{
              p: 0,
              m: 0,
              ml: 1,
            }}
          >
            <sub>
              <Tooltip title={description}>
                <SvgIcon color="primary">
                  <HelpCircle width="16px" height="16px" fontSize="1em" />
                </SvgIcon>
              </Tooltip>
            </sub>
          </Box>
        </Grid>
        <Grid item xs>
          {children}
        </Grid>
      </Grid>
      <Divider />
    </Container>
  );
};

export default FieldWrapper;
