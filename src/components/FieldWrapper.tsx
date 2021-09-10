import {
  Grid,
  makeStyles,
  Typography,
  SvgIcon,
  Divider,
  Container,
  Tooltip,
} from '@material-ui/core';
import React, { FC, ReactNode } from 'react';
import { HelpCircle } from 'react-feather';
import { Theme } from '../utils/theme';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    padding: theme.spacing(2),
  },
  innerContainer: {
    marginBottom: theme.spacing(1),
  },
  labelGridItem: {
    width: '260px',
    paddingRight: theme.spacing(2),
    display: `flex`,
    flexFlow: `row wrap`,
  },
  questionMark: {
    marginLeft: theme.spacing(1),
  },
}));

type FieldWrapperProps = {
  label: string;
  description: string;
  children: ReactNode;
};

const FieldWrapper: FC<FieldWrapperProps> = ({
  label,
  description,
  children,
}: FieldWrapperProps): JSX.Element => {
  const classes = useStyles();

  return (
    <Container maxWidth={false} disableGutters className={classes.container}>
      <Grid container className={classes.innerContainer}>
        <Grid item xs={4} className={classes.labelGridItem}>
          <Typography variant="body1">{label}</Typography>
          <sub className={classes.questionMark}>
            <Tooltip title={description}>
              <SvgIcon color="primary">
                <HelpCircle width="16px" height="16px" fontSize="1em" />
              </SvgIcon>
            </Tooltip>
          </sub>
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
