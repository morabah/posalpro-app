/**
 * i18n Mock for React-i18next
 *
 * This mock provides simulated internationalization functionality for testing
 * components that rely on react-i18next.
 */

// Mock translation function
export const t = jest.fn((key: string, options?: { defaultValue?: string; [key: string]: any }) => {
  // Simple handling of interpolation
  if (options && typeof key === 'string') {
    let result = key;
    Object.entries(options).forEach(([k, v]) => {
      if (k !== 't' && k !== 'i18n' && k !== 'tDescription') {
        result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      }
    });
    return result;
  }
  return key;
});

// Mock useTranslation hook
export const mockUseTranslation = () => ({
  t,
  i18n: {
    language: 'en',
    changeLanguage: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockReturnValue(true),
    getFixedT: jest.fn().mockReturnValue(t),
    hasResourceBundle: jest.fn().mockReturnValue(true),
    options: {
      defaultNS: 'common',
      fallbackLng: 'en',
    },
  },
  ready: true,
});

// Reset the mock translation function
export const resetTranslationMock = () => {
  t.mockReset().mockImplementation(
    (key: string, options?: { defaultValue?: string; [key: string]: any }) => {
      if (options && typeof key === 'string') {
        let result = key;
        Object.entries(options).forEach(([k, v]) => {
          if (k !== 't' && k !== 'i18n' && k !== 'tDescription') {
            result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
          }
        });
        return result;
      }
      return key;
    }
  );
};

// Set a specific language for testing
export const setMockLanguage = (language: string) => {
  mockUseTranslation().i18n.language = language;
};
