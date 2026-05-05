import type { PaletteMode } from '@mui/material';

export interface ThemeTokens {
  background: {
    page: string;
    surface: string;
    surfaceMuted: string;
    surfaceStrong: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  border: string;
  primary: {
    main: string;
    light: string;
    dark: string;
    soft: string;
  };
  success: {
    main: string;
    soft: string;
  };
  warning: {
    main: string;
    soft: string;
  };
  danger: {
    main: string;
    soft: string;
  };
  info: {
    main: string;
    soft: string;
  };
  sidebar: {
    background: string;
    panel: string;
    hover: string;
    active: string;
    divider: string;
    text: string;
    muted: string;
    accent: string;
    accentSoft: string;
  };
  shadow: {
    card: string;
    raised: string;
  };
}

export const getThemeTokens = (mode: PaletteMode): ThemeTokens => {
  if (mode === 'dark') {
    return {
      background: {
        page: '#0C1410',
        surface: '#121D17',
        surfaceMuted: '#18261F',
        surfaceStrong: '#1E2D25',
      },
      text: {
        primary: '#EAF3EE',
        secondary: '#B6C8BE',
        muted: '#8DA399',
      },
      border: '#23362C',
      primary: {
        main: '#74D39C',
        light: '#A4E8BE',
        dark: '#42A96D',
        soft: 'rgba(116, 211, 156, 0.16)',
      },
      success: {
        main: '#6AD28D',
        soft: 'rgba(106, 210, 141, 0.16)',
      },
      warning: {
        main: '#E3C15A',
        soft: 'rgba(227, 193, 90, 0.14)',
      },
      danger: {
        main: '#F08A8A',
        soft: 'rgba(240, 138, 138, 0.14)',
      },
      info: {
        main: '#72B4FF',
        soft: 'rgba(114, 180, 255, 0.14)',
      },
      sidebar: {
        background: '#101B15',
        panel: '#15231C',
        hover: '#1C2E25',
        active: '#1E7B4B',
        divider: '#22362C',
        text: '#EAF3EE',
        muted: '#A9BCB1',
        accent: '#74D39C',
        accentSoft: 'rgba(116, 211, 156, 0.16)',
      },
      shadow: {
        card: '0 10px 24px rgba(0, 0, 0, 0.24)',
        raised: '0 16px 40px rgba(0, 0, 0, 0.34)',
      },
    };
  }

  return {
    background: {
      page: '#F4FAF6',
      surface: '#FFFFFF',
      surfaceMuted: '#F1F7F3',
      surfaceStrong: '#E8F2EC',
    },
    text: {
      primary: '#173127',
      secondary: '#587066',
      muted: '#819589',
    },
    border: '#D4E1D8',
    primary: {
      main: '#1F8A56',
      light: '#4EAF77',
      dark: '#146642',
      soft: 'rgba(31, 138, 86, 0.12)',
    },
    success: {
      main: '#2E9D5A',
      soft: 'rgba(46, 157, 90, 0.12)',
    },
    warning: {
      main: '#B98511',
      soft: 'rgba(185, 133, 17, 0.12)',
    },
    danger: {
      main: '#C94D4D',
      soft: 'rgba(201, 77, 77, 0.12)',
    },
    info: {
      main: '#2D78C5',
      soft: 'rgba(45, 120, 197, 0.12)',
    },
    sidebar: {
      background: '#F8FCF9',
      panel: '#FFFFFF',
      hover: '#EEF7F2',
      active: '#1F8A56',
      divider: '#DCE8E0',
      text: '#173127',
      muted: '#6E8378',
      accent: '#1F8A56',
      accentSoft: 'rgba(31, 138, 86, 0.10)',
    },
    shadow: {
      card: '0 10px 26px rgba(18, 54, 37, 0.06)',
      raised: '0 18px 44px rgba(18, 54, 37, 0.10)',
    },
  };
};
