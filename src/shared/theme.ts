/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { colors, createTheme, responsiveFontSizes } from '@material-ui/core';
import type { Theme as MuiTheme } from '@material-ui/core/styles/createTheme';
import type {
  Palette as MuiPalette,
  TypeBackground as MuiTypeBackground,
} from '@material-ui/core/styles/createPalette';
import type { Shadows as MuiShadows } from '@material-ui/core/styles/shadows';
import _ from 'lodash';

import { softShadows, strongShadows } from './shadows';
import typography from './typography';
import { THEMES } from './constants';

interface TypeBackground extends MuiTypeBackground {
  dark: string;
}

interface Palette extends MuiPalette {
  background: TypeBackground;
}

export interface Theme extends MuiTheme {
  name: string;
  palette: Palette;
}

interface ThemeConfig {
  responsiveFontSizes?: boolean;
  theme?: string;
}

interface ThemeOptions {
  name?: string;
  typography?: Record<string, any>;
  overrides?: Record<string, any>;
  palette?: Record<string, any>;
  shadows?: MuiShadows;
}

const baseOptions: ThemeOptions = {
  typography,
  overrides: {
    MuiLinearProgress: {
      root: {
        borderRadius: 3,
        overflow: 'hidden',
      },
    },
    MuiListItemIcon: {
      root: {
        minWidth: 32,
      },
    },
    MuiButton: {
      root: {
        borderRadius: 64,
      },
    },
    MuiChip: {
      root: {
        backgroundColor: 'rgba(0,0,0,0.075)',
      },
    },
    MuiBackdrop: {
      root: {
        backgroundColor: 'rgba(68, 56, 102, 0.8)',
      },
    },
  },
};

const themesOptions: ThemeOptions[] = [
  {
    name: THEMES.LIGHT,
    overrides: {
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
      type: 'light',
      action: {
        active: colors.blueGrey[600],
      },
      background: {
        default: '#E3E3E3',
        dark: '#f7f6fd',
        paper: colors.common.white,
      },
      primary: {
        main: '#6E43E8',
      },
      secondary: {
        main: colors.common.white,
        contrastText: '#6E43E8',
      },
    },
    shadows: softShadows,
  },
  {
    name: THEMES.DARK,
    palette: {
      type: 'dark',
      text: {
        secondary: 'rgba(255,255,255,0.9)',
      },
      background: {
        default: '#262626',
        paper: '#262626',
        dark: '#1a1a1a',
      },
      primary: {
        main: '#6e43e8',
      },
      secondary: {
        main: colors.common.white,
      },
    },
    shadows: strongShadows,
  },
];

export const createMuiTheme = (config: ThemeConfig = {}): Theme => {
  let themeOptions = themesOptions.find((t) => t.name === config.theme);

  if (!themeOptions) {
    console.warn(new Error(`The theme ${config.theme} is not valid`));
    [themeOptions] = themesOptions;
  }

  let theme = createTheme(_.merge({}, baseOptions, themeOptions));

  if (config.responsiveFontSizes) {
    theme = responsiveFontSizes(theme);
  }

  return theme as Theme;
};