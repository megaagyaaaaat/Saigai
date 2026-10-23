import '@testing-library/jest-dom';

// Mock window.matchMedia for useReducedMotion and responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver for ECharts and MapLibre
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
