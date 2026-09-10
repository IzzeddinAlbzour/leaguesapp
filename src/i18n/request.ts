import { getRequestConfig } from 'next-intl/server';

// Single locale for now. next-intl still owns message loading and formatting
// so copy stays out of JSX and a second locale is a config change, not a refactor.
export default getRequestConfig(async () => ({
  locale: 'ar',
  messages: (await import('../messages/ar.json')).default,
}));
