// src/context/__tests__/ModalContext.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ModalProvider, useModal } from '../ModalContext';

// Test component to access context
function TestComponent() {
    const {
        activeModal,
        activeDrawer,
        notification,
        openModal,
        closeModal,
        openDrawer,
        closeDrawer,
        showNotification,
        trackingCode,
        setTrackingCode
    } = useModal();

    return (
        <div>
            <span data-testid="modal">{activeModal || 'none'}</span>
            <span data-testid="drawer">{activeDrawer || 'none'}</span>
            <span data-testid="notification">{notification?.message || notification || 'none'}</span>
            <span data-testid="tracking">{trackingCode || 'none'}</span>
            <button onClick={() => openModal('login')}>Open Login</button>
            <button onClick={() => closeModal()}>Close Modal</button>
            <button onClick={() => openDrawer('cart')}>Open Cart</button>
            <button onClick={() => closeDrawer()}>Close Drawer</button>
            <button onClick={() => showNotification('Test message')}>Show Notification</button>
            <button onClick={() => setTrackingCode('ABC123')}>Set Tracking</button>
        </div>
    );
}

describe('ModalContext', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('provides initial state with no active modal', () => {
        render(
            <ModalProvider>
                <TestComponent />
            </ModalProvider>
        );

        expect(screen.getByTestId('modal').textContent).toBe('none');
    });

    it('provides initial state with no active drawer', () => {
        render(
            <ModalProvider>
                <TestComponent />
            </ModalProvider>
        );

        expect(screen.getByTestId('drawer').textContent).toBe('none');
    });

    it('opens modal when openModal is called', async () => {
        render(
            <ModalProvider>
                <TestComponent />
            </ModalProvider>
        );

        const openButton = screen.getByText('Open Login');
        await act(() => {
            openButton.click();
        });

        expect(screen.getByTestId('modal').textContent).toBe('login');
    });

    it('closes modal when closeModal is called', async () => {
        render(
            <ModalProvider>
                <TestComponent />
            </ModalProvider>
        );

        const openButton = screen.getByText('Open Login');
        await act(() => openButton.click());

        const closeButton = screen.getByText('Close Modal');
        await act(() => closeButton.click());

        expect(screen.getByTestId('modal').textContent).toBe('none');
    });

    it('opens drawer when openDrawer is called', async () => {
        render(
            <ModalProvider>
                <TestComponent />
            </ModalProvider>
        );

        const openButton = screen.getByText('Open Cart');
        await act(() => openButton.click());

        expect(screen.getByTestId('drawer').textContent).toBe('cart');
    });

    it('closes drawer when closeDrawer is called', async () => {
        render(
            <ModalProvider>
                <TestComponent />
            </ModalProvider>
        );

        const openButton = screen.getByText('Open Cart');
        await act(() => openButton.click());

        const closeButton = screen.getByText('Close Drawer');
        await act(() => closeButton.click());

        expect(screen.getByTestId('drawer').textContent).toBe('none');
    });

    it('shows notification when showNotification is called', async () => {
        render(
            <ModalProvider>
                <TestComponent />
            </ModalProvider>
        );

        const notifyButton = screen.getByText('Show Notification');
        await act(() => notifyButton.click());

        expect(screen.getByTestId('notification').textContent).toBe('Test message');
    });

    it('clears notification after timeout', async () => {
        render(
            <ModalProvider>
                <TestComponent />
            </ModalProvider>
        );

        const notifyButton = screen.getByText('Show Notification');
        await act(() => notifyButton.click());

        expect(screen.getByTestId('notification').textContent).toBe('Test message');

        await act(() => {
            vi.advanceTimersByTime(4000);
        });

        expect(screen.getByTestId('notification').textContent).toBe('none');
    });

    it('sets tracking code', async () => {
        render(
            <ModalProvider>
                <TestComponent />
            </ModalProvider>
        );

        const trackingButton = screen.getByText('Set Tracking');
        await act(() => trackingButton.click());

        expect(screen.getByTestId('tracking').textContent).toBe('ABC123');
    });
});







