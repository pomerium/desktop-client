import { CheckCircle } from '@mui/icons-material';
import { Button, Container, Grid } from '@mui/material';
import React, { FC } from 'react';
import { ipcRenderer } from 'electron';
import { VIEW_CONNECTION_LIST } from '../../shared/constants';

type Props = {};
const LoadForm: FC<Props> = () => {
  const handleClickBack = (): void => {
    ipcRenderer.send(VIEW_CONNECTION_LIST);
  };

  const handleClickLoad = (): void => {
    ipcRenderer.send(VIEW_CONNECTION_LIST);
  };

  return (
    <>
      <Container maxWidth={false}>
        <Grid
          container
          spacing={2}
          alignItems="flex-end"
          justifyContent="flex-end"
          sx={{ mt: 3 }}
        >
          <Grid item>
            <Button
              type="button"
              variant="contained"
              color="secondary"
              onClick={handleClickBack}
            >
              Back
            </Button>
          </Grid>
          <Grid item>
            <Button
              type="button"
              variant="contained"
              color="primary"
              onClick={handleClickLoad}
              endIcon={<CheckCircle />}
            >
              Load
            </Button>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default LoadForm;
