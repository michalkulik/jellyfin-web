import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as updateState from './updateState';

/**
 * Minimal native shell, modelling what the different app versions expose.
 */
function installNativeShell(options: {
    checkForUpdates?: boolean;
    updateState?: Record<string, unknown>;
}) {
    const shell = {
        getUpdateState: vi.fn(() => options.updateState ?? { state: 'unknown' }),
        openUpdateDialog: vi.fn(),
        ...(options.checkForUpdates ? { checkForUpdates: vi.fn() } : {})
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

    it('asks the app to check when it supports a manual check', async () => {
        const shell = installNativeShell({ checkForUpdates: true, updateState: { state: 'uptodate' } });
        await updateState.refresh();

        updateState.checkForUpdates();

        expect(shell.checkForUpdates).toHaveBeenCalledTimes(1);
        expect(shell.openUpdateDialog).not.toHaveBeenCalled();
    });

    it('falls back to the prompt on older apps that know about an update', async () => {
        const shell = installNativeShell({ updateState: { state: 'available', version: '0.3.10' } });
        await updateState.refresh();

        updateState.checkForUpdates();

        expect(shell.openUpdateDialog).toHaveBeenCalledTimes(1);
    });

    it('does nothing on older apps when no update is known', async () => {
        // Their dialog cannot tell that nothing needs installing, so it must not be opened.
        const shell = installNativeShell({ updateState: { state: 'uptodate' } });
        await updateState.refresh();

        updateState.checkForUpdates();

        expect(shell.openUpdateDialog).not.toHaveBeenCalled();
    });

    it('does nothing without a native shell', () => {
        expect(() => updateState.checkForUpdates()).not.toThrow();
    });
});
