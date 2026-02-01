import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
    default: vi.fn(),
}));

// Mock window.scrollTo
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
}

// Mock HTMLCanvasElement.getContext (creates a dummy context)
if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn();
}
