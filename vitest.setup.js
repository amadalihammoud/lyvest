import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
    default: vi.fn(),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

// Mock HTMLCanvasElement.getContext (creates a dummy context)
HTMLCanvasElement.prototype.getContext = vi.fn();
