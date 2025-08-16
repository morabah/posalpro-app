declare module 'jest-axe' {
  export function axe(element: Element): Promise<any>;
  export const toHaveNoViolations: jest.ExpectExtendMap;
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }

    // align global Jest typings used by expect.extend
    interface ExpectExtendMap {
      [key: string]: any;
    }
  }
}
