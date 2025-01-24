import {
  Button,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { ipcRenderer } from 'electron';
import { useSnackbar } from 'notistack';
import React, { ReactElement, useEffect, useState } from 'react';
import { Save, Upload } from 'react-feather';

import {
  DELETE,
  EXPORT,
  ExportFile,
  GET_ALL_RECORDS,
  GET_UNIQUE_TAGS,
  IMPORT,
  LISTENER_STATUS,
  SAVE_RECORD,
  TOAST_LENGTH,
  VIEW,
} from '../../shared/constants';
import {
  ListenerStatus,
  Record as ListenerRecord,
  Selector,
} from '../../shared/pb/api';
import ConnectionRow from '../components/ConnectionRow';
import ExportDialog, {
  IpcRendererEventListener,
} from '../components/ExportDialog';
import NewConnectionButton from '../components/NewConnectionButton';
import StyledCard from '../components/StyledCard';
import TagFolderRow from '../components/TagFolderRow';
import VirtualFolderRow from '../components/VirtualFolderRow';

function ManageConnections(): ReactElement {
  const [folderNames, setFolderNames] = useState([] as string[]);
  const [connections, setConnections] = useState([] as ListenerRecord[]);
  const [exportFile, setExportFile] = useState<ExportFile | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ListenerStatus>>({});
  const { enqueueSnackbar } = useSnackbar();

  const getConnectedCount = (conns: ListenerRecord[]) => {
    return (
      conns
        .map((rec) => rec.id as string)
        .filter((id) => statuses[id]?.listening).length || 0
    );
  };

  useEffect(() => {
    const listener: IpcRendererEventListener = (_, args) => {
      if (args.err) {
        enqueueSnackbar(args.err.message, {
          variant: 'error',
          autoHideDuration: TOAST_LENGTH,
        });
      } else {
        const blob = new Blob([args.data], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = args.filename.replace(/\s+/g, '_') + '.json';
        link.click();
      }
    };
    ipcRenderer.on(EXPORT, listener);
    return () => {
      ipcRenderer.removeListener(EXPORT, listener);
    };
  }, []);

  useEffect(() => {
    ipcRenderer.on(GET_UNIQUE_TAGS, (_, args) => {
      if (args.tags && !args.err) {
        setFolderNames(args.tags);
      }
    });
    ipcRenderer.on(GET_ALL_RECORDS, (_, args) => {
      if (args.err) {
        enqueueSnackbar(args.err.message, {
          variant: 'error',
          autoHideDuration: TOAST_LENGTH,
        });
      } else {
        setConnections(args.res.records);
      }
    });
    ipcRenderer.on(LISTENER_STATUS, (_, args) => {
      if (args.err) {
        enqueueSnackbar(args.err.message, {
          variant: 'error',
          autoHideDuration: TOAST_LENGTH,
        });
      } else {
        Object.values(args.res.listeners as ListenerStatus[]).forEach(
          ({ lastError }) => {
            if (lastError) {
              enqueueSnackbar(lastError, {
                variant: 'error',
                autoHideDuration: TOAST_LENGTH,
              });
            }
          },
        );
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
        enqueueSnackbar(args.err.message, {
          variant: 'error',
          autoHideDuration: TOAST_LENGTH,
        });
      }
    });
    ipcRenderer.on(IMPORT, (_, args) => {
      if (args.err) {
        enqueueSnackbar(args.err.message, {
          variant: 'error',
          autoHideDuration: TOAST_LENGTH,
        });
      } else {
        enqueueSnackbar('Uploaded Successfully', {
          variant: 'success',
          autoHideDuration: TOAST_LENGTH,
        });
        ipcRenderer.send(GET_ALL_RECORDS);
        ipcRenderer.send(GET_UNIQUE_TAGS);
      }
    });
    ipcRenderer.on(SAVE_RECORD, (_, args) => {
      if (args.err) {
        enqueueSnackbar(args.err.message, {
          variant: 'error',
          autoHideDuration: TOAST_LENGTH,
        });
      } else {
        ipcRenderer.send(VIEW, args.res.id);
      }
    });
    ipcRenderer.send(LISTENER_STATUS, {
      all: true,
      ids: [],
      tags: [],
    } as Selector);
    ipcRenderer.send(GET_UNIQUE_TAGS);
    ipcRenderer.send(GET_ALL_RECORDS);

    return function cleanup() {
      ipcRenderer.removeAllListeners(GET_UNIQUE_TAGS);
      ipcRenderer.removeAllListeners(GET_ALL_RECORDS);
      ipcRenderer.removeAllListeners(LISTENER_STATUS);
      ipcRenderer.removeAllListeners(DELETE);
      ipcRenderer.removeAllListeners(IMPORT);
      ipcRenderer.removeAllListeners(SAVE_RECORD);
    };
  }, []);

  const untagged = connections?.filter(
    (connection) => !connection?.tags?.length,
  );

  return (
    <>
      <ExportDialog
        exportFile={exportFile}
        onClose={() => setExportFile(null)}
      />
      <Container maxWidth={false} sx={{ pt: 4 }}>
        <Stack spacing={2}>
          <Grid>
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
                    endIcon={<Upload />}
                  >
                    Import
                  </Button>
                </Grid>
                <Grid item xs={1} />
                {connections?.length > 0 && (
                  <Grid item>
                    <Button
                      type="button"
                      color="primary"
                      onClick={() =>
                        setExportFile({
                          filename: 'connections',
                          selector: {
                            all: true,
                            ids: [],
                            tags: [],
                          },
                        })
                      }
                      endIcon={<Save />}
                    >
                      Export
                    </Button>
                  </Grid>
                )}
                {connections?.length > 0 && <Grid item xs={1} />}
                <Grid item>
                  <NewConnectionButton />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <StyledCard>
            <CardContent>
              {folderNames.map((folderName) => {
                const folderConns = connections.filter(
                  (connection) => connection?.tags?.indexOf(folderName) >= 0,
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
                          connection={record}
                          connected={
                            !!record?.id &&
                            statuses[record.id as string]?.listening
                          }
                          port={statuses[record.id as string]?.listenAddr || ''}
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
                      connection={record}
                      connected={
                        !!record?.id && statuses[record.id as string]?.listening
                      }
                      port={statuses[record.id as string]?.listenAddr || ''}
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
                      connection={record}
                      connected={
                        !!record?.id && statuses[record.id as string]?.listening
                      }
                      port={statuses[record.id as string]?.listenAddr || ''}
                    />
                  );
                })}
              </VirtualFolderRow>
            </CardContent>
          </StyledCard>
        </Stack>
      </Container>
    </>
  );
}
export default ManageConnections;
