/* eslint-disable react/jsx-props-no-spreading */
import { AppBar, Autocomplete, Grid, TextField, Toolbar } from '@mui/material';
import { createFilterOptions } from '@mui/material/useAutocomplete';
import { ipcRenderer } from 'electron';
import React, { FC, useEffect, useState } from 'react';
import { Search } from 'react-feather';

import { GET_ALL_RECORDS, VIEW } from '../../shared/constants';
import { Record as ListenerRecord } from '../../shared/pb/api';
import Logo from '../icons/Logo';
import TopTabs from './TopTabs';

const TopBar: FC = () => {
  const [connections, setConnections] = useState([] as ListenerRecord[]);
  const [filter, setFilter] = useState('');

  const handleChange = (_e, conn) => {
    if (conn?.id) {
      ipcRenderer.send(VIEW, conn.id);
    }
  };

  const fetch = () => {
    ipcRenderer.once(GET_ALL_RECORDS, (_e, args) => {
      if (!args.err) {
        setConnections(args.res.records);
      }
    });
    ipcRenderer.send(GET_ALL_RECORDS);
  };

  const filterOptions = createFilterOptions({
    stringify: (option: ListenerRecord) =>
      option.tags.join(' ') +
      (option?.conn?.name || '') +
      (option?.conn?.remoteAddr || ''),
  });

  useEffect(() => {
    fetch();
  }, []);

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Grid container alignItems="center">
          <Grid item xs={9}>
            <Logo />
          </Grid>
          <Grid item xs={3}>
            <Autocomplete
              id="search"
              sx={{
                '& .MuiAutocomplete-popupIndicatorOpen': {
                  transform: 'none',
                },
              }}
              options={connections}
              filterOptions={filterOptions}
              getOptionLabel={(option: ListenerRecord) =>
                option?.conn?.name || ''
              }
              isOptionEqualToValue={(
                option: ListenerRecord,
                value: ListenerRecord,
              ) => {
                return option.id === value.id;
              }}
              inputValue={filter}
              clearOnBlur
              onOpen={fetch}
              onInputChange={(_e, newInputValue, reason) => {
                if (reason === 'reset') {
                  setFilter('');
                } else {
                  setFilter(newInputValue);
                }
              }}
              onChange={handleChange}
              popupIcon={<Search color="white" />}
              renderInput={(params) => (
                <TextField
                  {...params}
                  autoFocus={false}
                  variant="outlined"
                  margin="dense"
                  fullWidth
                />
              )}
            />
          </Grid>
        </Grid>
      </Toolbar>
      <TopTabs />
    </AppBar>
  );
};
export default TopBar;
