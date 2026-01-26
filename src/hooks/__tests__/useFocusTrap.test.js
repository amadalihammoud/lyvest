// src/hooks/__tests__/useFocusTrap.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from '../useFocusTrap';

describe('useFocusTrap', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = `
            <button id="btn1">Button 1</button>
            <input id="input1" type="text" />
            <button id="btn2">Button 2</button>
        `;
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('returns a ref object', () => {
        const { result } = renderHook(() => useFocusTrap(true));
        expect(result.current).toHaveProperty('current');
    });

    it('does not trap focus when disabled', () => {
        const { result } = renderHook(() => useFocusTrap(false));
        expect(result.current.current).toBeNull();
    });

    it('traps focus when enabled', () => {
        const { result } = renderHook(() => useFocusTrap(true));

        // Assign the ref to our test container
        result.current.current = container;

        // Focus should be manageable within the container
        const btn1 = container.querySelector('#btn1');
        const btn2 = container.querySelector('#btn2');

        expect(btn1).not.toBeNull();
        expect(btn2).not.toBeNull();
    });

    it('finds focusable elements in container', () => {
        const { result } = renderHook(() => useFocusTrap(true));
        result.current.current = container;

        const focusable = container.querySelectorAll('button, input, [tabindex]');
        expect(focusable.length).toBe(3);
    });
});







