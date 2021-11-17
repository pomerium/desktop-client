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
import { Alert } from '@material-ui/lab';
import { ServiceError } from '@grpc/grpc-js';
import Card from '../components/Card';
import { Theme } from '../../shared/theme';
import TagFolderRow from '../components/TagFolderRow';
import ConnectionRow from '../components/ConnectionRow';
import VirtualFolderRow from '../components/VirtualFolderRow';
import {
  ListenerStatus,
  Record as ListenerRecord,
  Selector,
} from '../../shared/pb/api';
import {
  DELETE,
  EXPORT,
  GET_RECORDS,
  GET_UNIQUE_TAGS,
  IMPORT,
  LISTENER_STATUS,
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
  const [connections, setConnections] = useState([] as ListenerRecord[]);
  const [statuses, setStatuses] = useState(
    {} as { [key: string]: ListenerStatus }
  );
  const [error, setError] = useState(null as ServiceError | null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const getConnectedCount = (conns: ListenerRecord[]) => {
    return (
      conns
        .map((rec) => rec.id as string)
        .filter((id) => statuses[id]?.listening).length || 0
    );
  };

  useEffect(() => {
    if (uploadSuccess) {
      setTimeout(() => setUploadSuccess(false), 1000);
    }
  }, [uploadSuccess]);

  useEffect(() => {
    ipcRenderer.on(GET_UNIQUE_TAGS, (_, args) => {
      if (args.tags && !args.err) {
        setFolderNames(args.tags);
      }
    });
    ipcRenderer.on(GET_RECORDS, (_, args) => {
      if (args.err) {
        setError(args.err);
      } else {
        setConnections(args.res.records);
      }
    });
    ipcRenderer.on(LISTENER_STATUS, (_, args) => {
      if (args.err) {
        setError(args.err);
      } else {
        setStatuses((prevState) => {
          return {
            ...prevState,
            ...args.res.listeners,
          };
        });
      }
    });
    ipcRenderer.on(DELETE, (_, args) => {
      if (args.err) {
        setError(args.err);
      }
    });
    ipcRenderer.on(EXPORT, (_, args) => {
      if (args.err) {
        setError(args.err);
      } else {
        const blob = new Blob([args.data], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = args.filename.replace(/\s+/g, '_') + '.json';
        link.click();
      }
    });
    ipcRenderer.on(IMPORT, (_, args) => {
      if (args.err) {
        setError(args.err);
      } else {
        setUploadSuccess(true);
        ipcRenderer.send(GET_RECORDS, {
          all: true,
          ids: [],
          tags: [],
        } as Selector);
      }
    });
    ipcRenderer.send(LISTENER_STATUS, {
      all: true,
      ids: [],
      tags: [],
    } as Selector);
    ipcRenderer.send(GET_UNIQUE_TAGS);
    ipcRenderer.send(GET_RECORDS, {
      all: true,
      ids: [],
      tags: [],
    } as Selector);

    return function cleanup() {
      ipcRenderer.removeAllListeners(GET_UNIQUE_TAGS);
      ipcRenderer.removeAllListeners(GET_RECORDS);
      ipcRenderer.removeAllListeners(LISTENER_STATUS);
      ipcRenderer.removeAllListeners(DELETE);
      ipcRenderer.removeAllListeners(EXPORT);
      ipcRenderer.removeAllListeners(IMPORT);
    };
  }, []);

  if (connections.length > 0) {
    const untagged = connections.filter(
      (connection) => !connection?.tags?.length
    );
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
                  onClick={() => ipcRenderer.send(IMPORT)}
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

        {error && (
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Alert severity="error">{error.message}</Alert>
            </Grid>
          </Grid>
        )}
        {uploadSuccess && (
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Alert severity="info">Upload Successful!</Alert>
            </Grid>
          </Grid>
        )}
        {Object.values(statuses)
          .filter((status) => !!status.lastError)
          .map((status) => (
            <Grid
              key={'err' + Math.random()}
              container
              spacing={2}
              justifyContent="center"
            >
              <Grid item>
                <Alert severity="error">{status.lastError}</Alert>
              </Grid>
            </Grid>
          ))}

        <Card>
          {folderNames.map((folderName) => {
            const folderConns = connections.filter(
              (connection) => connection?.tags?.indexOf(folderName) >= 0
            );
            return (
              <TagFolderRow
                key={'folderRow' + folderName}
                folderName={folderName}
                connectedListeners={getConnectedCount(folderConns)}
                totalListeners={folderConns.length}
                connectionIds={folderConns.map((rec) => rec.id as string)}
              >
                {folderConns.map((record) => {
                  return (
                    <ConnectionRow
                      key={'connectionRow' + folderName + record.id}
                      folderName={folderName}
                      connectionID={record?.id || ''}
                      connectionName={record?.conn?.name || ''}
                      connected={
                        !!record?.id && statuses[record.id as string]?.listening
                      }
                    />
                  );
                })}
              </TagFolderRow>
            );
          })}
          <VirtualFolderRow
            folderName="All Connections"
            totalListeners={connections.length}
            connectedListeners={getConnectedCount(connections)}
          >
            {connections.map((record) => {
              return (
                <ConnectionRow
                  key={'connectionRowAllConnections' + record.id}
                  folderName="All Connections"
                  connectionID={record?.id || ''}
                  connectionName={record?.conn?.name || ''}
                  connected={
                    !!record?.id && statuses[record.id as string]?.listening
                  }
                />
              );
            })}
          </VirtualFolderRow>
          <VirtualFolderRow
            folderName="Untagged"
            totalListeners={untagged.length}
            connectedListeners={getConnectedCount(untagged)}
          >
            {untagged.map((record) => {
              return (
                <ConnectionRow
                  key={'connectionRowUntagged' + record.id}
                  folderName="Untagged"
                  connectionID={record?.id || ''}
                  connectionName={record?.conn?.name || ''}
                  connected={
                    !!record?.id && statuses[record.id as string]?.listening
                  }
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
