declare module 'canvas-confetti' {
    interface ConfettiOptions {
        angle?: number;
        spread?: number;
        startVelocity?: number;
        decay?: number;
        gravity?: number;
        drift?: number;
        ticks?: number;
        origin?: {
            x?: number;
            y?: number;
        };
        colors?: string[];
        shapes?: ('square' | 'circle')[];
        scalar?: number;
        zIndex?: number;
        disableForReducedMotion?: boolean;
        particleCount?: number;
    }

    interface Confetti {
        (options?: ConfettiOptions): Promise<null> | null;
        reset: () => void;
    }

    const confetti: Confetti;
    export default confetti;
}
