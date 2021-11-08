import React, { useEffect, useState } from 'react';
import {
  Button,
  Container,
  Grid,
  makeStyles,
  Typography,
} from '@material-ui/core';
import { Download, Plus } from 'react-feather';
import { Link } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import Card from '../components/Card';
import { Theme } from '../../shared/theme';
import TagFolderRow from '../components/TagFolderRow';
import ConnectionRow from '../components/ConnectionRow';
import VirtualFolderRow from '../components/VirtualFolderRow';
import { Record, Selector } from '../../shared/pb/api';
import {
  GET_RECORDS,
  GET_RECORDS_RESPONSE,
  GET_UNIQUE_TAGS,
  GET_UNIQUE_TAGS_RESPONSE,
} from '../../shared/constants';

const useStyles = makeStyles((theme: Theme) => ({
  titleGrid: {
    paddingTop: theme.spacing(4),
  },
  accordion: {
    backgroundColor: theme.palette.background.paper,
    marginTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    borderRadius: '16px',
    '&:before': {
      display: 'none',
    },
  },
}));

const ManageConnections = (): JSX.Element => {
  const classes = useStyles();
  const [folderNames, setFolderNames] = useState([] as string[]);
  const [connections, setConnections] = useState([] as Record[]);
  const [error, setError] = useState(null);

  useEffect(() => {
    ipcRenderer.once(GET_UNIQUE_TAGS_RESPONSE, (_, args) => {
      if (args.tags && !args.err) {
        setFolderNames(args.tags);
      }
    });
    ipcRenderer.send(GET_UNIQUE_TAGS);
    ipcRenderer.once(GET_RECORDS_RESPONSE, (_, args) => {
      console.log('called');
      if (args.err) {
        setError(args.err);
      } else {
        setConnections(args.res.records);
      }
    });
    ipcRenderer.send(GET_RECORDS, {
      all: true,
      ids: [],
      tags: [],
    } as Selector);
  }, []);

  if (connections.length > 0) {
    return (
      <Container maxWidth={false}>
        <Grid className={classes.titleGrid}>
          <Grid container alignItems="flex-start">
            <Grid item xs={6}>
              <Typography variant="h3" color="textPrimary">
                Manage Connections
              </Typography>
            </Grid>
            <Grid item xs={6} container justifyContent="flex-end">
              <Grid item>
                <Button
                  type="button"
                  color="primary"
                  onClick={() => alert('todo')}
                  endIcon={<Download />}
                >
                  Import
                </Button>
              </Grid>
              <Grid item xs={1} />
              <Grid item>
                <Button
                  type="button"
                  variant="contained"
                  component={Link}
                  to="/connectForm"
                  color="primary"
                  endIcon={<Plus />}
                >
                  New Connection
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Card>
          {folderNames.map((folderName) => {
            return (
              <TagFolderRow
                key={'folderRow' + folderName}
                folderName={folderName}
              >
                {connections
                  .filter(
                    (connection) => connection?.tags?.indexOf(folderName) >= 0
                  )
                  .map((record) => {
                    return (
                      <ConnectionRow
                        key={'connectionRow' + folderName + record.id}
                        folderName={folderName}
                        connectionID={record?.id || ''}
                        connectionName={record?.conn?.name || ''}
                      />
                    );
                  })}
              </TagFolderRow>
            );
          })}
          <VirtualFolderRow folderName="All Connections">
            {connections.map((record) => {
              return (
                <ConnectionRow
                  key={'connectionRowAllConnections' + record.id}
                  folderName="All Connections"
                  connectionID={record?.id || ''}
                  connectionName={record?.conn?.name || ''}
                />
              );
            })}
          </VirtualFolderRow>
          <VirtualFolderRow folderName="Untagged">
            {connections
              .filter((connection) => !connection?.tags?.length)
              .map((record) => {
                return (
                  <ConnectionRow
                    key={'connectionRowUntagged' + record.id}
                    folderName="Untagged"
                    connectionID={record?.id || ''}
                    connectionName={record?.conn?.name || ''}
                  />
                );
              })}
          </VirtualFolderRow>
        </Card>
      </Container>
    );
  }

  return <></>;
};
export default ManageConnections;
