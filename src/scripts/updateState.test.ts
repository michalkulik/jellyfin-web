import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as updateState from './updateState';

/**
 * Minimal native shell, modelling what the app exposes to the web client.
 */
function installNativeShell(updateStateValue: Record<string, unknown>) {
    const shell = {
        getUpdateState: vi.fn(() => updateStateValue),
        openUpdateDialog: vi.fn()
    };

    (window as unknown as { NativeShell: unknown }).NativeShell = shell;
    return shell;
}

describe('updateState', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        delete (window as unknown as { NativeShell?: unknown }).NativeShell;
    });

    it('reports no update support without a native shell', async () => {
        await updateState.refresh();

        expect(updateState.supportsUpdateCheck()).toBe(false);
        expect(updateState.isUpdateAvailable()).toBe(false);
        expect(updateState.getVersion()).toBe('');
    });

    it('reads the state from the native shell', async () => {
        installNativeShell({ state: 'available', version: '0.3.10' });
        await updateState.refresh();

        expect(updateState.supportsUpdateCheck()).toBe(true);
        expect(updateState.isUpdateAvailable()).toBe(true);
        expect(updateState.getVersion()).toBe('0.3.10');
    });

    it('treats an up to date install as no update', async () => {
        installNativeShell({ state: 'uptodate' });
        await updateState.refresh();

        expect(updateState.isUpdateAvailable()).toBe(false);
    });

    it('notifies the listeners when the native state changes', async () => {
        const shell = installNativeShell({ state: 'uptodate' });
        const listener = vi.fn();

        updateState.init();
        updateState.addChangeListener(listener);

        shell.getUpdateState.mockReturnValue({ state: 'available', version: '0.3.11' });
        window.dispatchEvent(new CustomEvent('updatestatechange', { detail: { state: 'available', version: '0.3.11' } }));

        expect(listener).toHaveBeenCalledTimes(1);
        expect(updateState.isUpdateAvailable()).toBe(true);
        expect(updateState.getVersion()).toBe('0.3.11');

        updateState.removeChangeListener(listener);
    });

    it('opens the native prompt', () => {
        const shell = installNativeShell({ state: 'available' });

        updateState.openDialog();

        expect(shell.openUpdateDialog).toHaveBeenCalledTimes(1);
    });
});
