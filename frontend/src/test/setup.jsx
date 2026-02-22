import '@testing-library/jest-dom';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => {
            return ({ children, ...props }) => {
                const { initial, animate, transition, whileHover, whileTap, whileInView, variants, layoutId, ...domProps } = props;
                const DomTag = tag;
                return <DomTag {...domProps}>{children}</DomTag>;
            };
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock react-slick
vi.mock('react-slick', () => ({
    default: ({ children }) => <div>{children}</div>,
}));

// Mock slick-carousel CSS imports
vi.mock('slick-carousel/slick/slick.css', () => ({}));
vi.mock('slick-carousel/slick/slick-theme.css', () => ({}));

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: vi.fn((key) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });
