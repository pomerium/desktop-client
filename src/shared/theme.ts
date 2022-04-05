/* eslint-disable no-console */
import '@fontsource/dm-sans';
import * as colors from '@mui/material/colors';
import {
  createTheme,
  responsiveFontSizes,
  ThemeOptions,
  Theme,
} from '@mui/material/styles';
import _ from 'lodash';

import { softShadows, strongShadows } from './shadows';
import typography from './typography';
import { THEMES } from './constants';

export interface ThemeConfig {
  responsiveFontSizes?: boolean;
  theme: string;
}

const baseOptions: ThemeOptions = {
  typography,
  shape: {
    borderRadius: '16px',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@global': {
          '@fontFace': ['DM Sans'],
          '*': {
            boxSizing: 'border-box',
            margin: 0,
            padding: 0,
          },
          html: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            height: '100%',
            width: '100%',
          },
          body: {
            height: '100%',
            width: '100%',
          },
          '#root': {
            height: '100%',
            width: '100%',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          overflow: 'hidden',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 32,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(68, 56, 102, 0.8)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        separator: {
          opacity: '30%',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          padding: 0,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          display: 'flex',
          flexFlow: 'row nowrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '16px' },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px',
          display: 'flex',
          flexFlow: 'row nowrap',
          justifyContent: 'flex-end',
        },
      },
    },
  },
};

const getDesignTokens = (mode: string) => {
  if (mode === THEMES.LIGHT) {
    return {
      mode: THEMES.LIGHT,
      overrides: {
        MuiTooltip: {
          tooltip: {
            fontSize: '1em',
            color: '#6F43E7',
            backgroundColor: '#ECE5FF',
          },
        },
        MuiInputBase: {
          input: {
            '&::placeholder': {
              opacity: 1,
              color: colors.blueGrey[600],
            },
          },
        },
      },
      palette: {
        mode: 'light',
        action: {
          active: '#39256C',
        },
        background: {
          default: '#FBFBFB',
          dark: '#FBFBFB',
          paper: colors.common.white,
        },
        primary: {
          main: '#6F43E7',
        },
        secondary: {
          main: colors.common.white,
        },
      },
      shadows: softShadows,
    };
  }
  return {
    mode: THEMES.DARK,
    overrides: {
      MuiTooltip: {
        tooltip: {
          fontSize: '1em',
          color: '#ECE5FF',
          backgroundColor: '#6F43E7',
        },
      },
    },
    palette: {
      mode: 'dark',
      action: {
        active: '#49AAA1',
      },
      text: {
        secondary: 'rgba(255,255,255,0.9)',
      },
      background: {
        default: '#1a1a1a',
        paper: '#262626',
        dark: '#1a1a1a',
      },
      primary: {
        main: '#6F43E7',
        light: '#ECE5FF',
        dark: '#39256C',
      },

      secondary: {
        main: '#49AAA1',
      },
    },
    shadows: strongShadows,
  };
};

const createCustomTheme = (config: ThemeConfig): Theme => {
  const themeOptions = getDesignTokens(config.theme);
  let customTheme = createTheme(_.merge({}, baseOptions, themeOptions));

  if (config.responsiveFontSizes) {
    customTheme = responsiveFontSizes(customTheme);
  }

  return customTheme as Theme;
};

export default createCustomTheme;
