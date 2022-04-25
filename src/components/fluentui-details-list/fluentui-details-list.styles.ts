import { IDetailsListStyles } from '@fluentui/react/lib/DetailsList';

export const GridStyles: Partial<IDetailsListStyles> = {
  root: {
    overflowX: 'auto',
    selectors: {
      '& [role=grid]': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'start',
      },
    },
  },
  headerWrapper: {
    flex: '0 0 auto',
  },
  contentWrapper: {
    flex: '1 1 auto',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
};
