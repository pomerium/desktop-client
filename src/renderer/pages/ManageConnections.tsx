import React, { useEffect, useState } from 'react';
import {
  Button,
  Container,
  Grid,
  makeStyles,
  Typography,
} from '@material-ui/core';
import Card from '../components/Card';
import { Download, Plus } from 'react-feather';
import { Theme } from '../../shared/theme';
import { Link } from 'react-router-dom';
import Connections from '../../shared/connections';
import { ConnectionData } from '../../shared/constants';
import TagFolderRow from '../components/TagFolderRow';
import ConnectionRow from '../components/ConnectionRow';
import VirtualFolderRow from '../components/VirtualFolderRow';

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
  const [connections, setConnections] = useState([] as ConnectionData[]);

  const fetchData = (): void => {
    const connHandler = new Connections();
    setFolderNames(connHandler.getExistingTags());
    setConnections(Object.values(connHandler.getConnections()));
  };

  useEffect(() => {
    fetchData();
  }, []);

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
                to={'/connectForm'}
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
            <TagFolderRow folderName={folderName}>
              {connections
                .filter(
                  (connection) => connection?.tags?.indexOf(folderName) >= 0
                )
                .map((conn) => {
                  return (
                    <ConnectionRow folderName={folderName} connection={conn} />
                  );
                })}
            </TagFolderRow>
          );
        })}
        <VirtualFolderRow folderName={'All Connections'}>
          {connections.map((conn) => {
            return (
              <ConnectionRow folderName={'All Connections'} connection={conn} />
            );
          })}
        </VirtualFolderRow>
        <VirtualFolderRow folderName={'Untagged'}>
          {connections
            .filter((connection) => !connection?.tags?.length)
            .map((conn) => {
              return (
                <ConnectionRow folderName={'Untagged'} connection={conn} />
              );
            })}
        </VirtualFolderRow>
      </Card>
    </Container>
  );
};
export default ManageConnections;
