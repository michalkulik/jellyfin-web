import shell from './shell';

const NATIVE_CHANGE_EVENT = 'updatestatechange';
const CHANGE_EVENT = 'updatestatechange-local';

const UNKNOWN_STATE = { state: 'unknown' };

let updateState = UNKNOWN_STATE;
let initialized = false;

/**
 * Whether the native app can check for and install its own updates.
 */
export function supportsUpdateCheck() {
    return typeof window !== 'undefined'
        && typeof window.NativeShell?.getUpdateState === 'function';
}

/**
 * Refreshes the cached update state from the native shell.
 */
export async function refresh() {
    if (!supportsUpdateCheck()) return;

    try {
        updateState = await window.NativeShell.getUpdateState() || UNKNOWN_STATE;
    } catch (err) {
        console.error('Failed to read the update state', err);
        updateState = UNKNOWN_STATE;
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Applies a state pushed by the native shell.
 */
function onNativeChange(event) {
    if (event?.detail && typeof event.detail === 'object') {
        updateState = event.detail;
        window.dispatchEvent(new Event(CHANGE_EVENT));
    } else {
        refresh();
    }
}

/**
 * Initializes the update state and subscribes to native state changes.
 */
export function init() {
    if (initialized || typeof window === 'undefined') return;
    initialized = true;

    window.addEventListener(NATIVE_CHANGE_EVENT, onNativeChange);
    refresh();
}

/**
 * Returns the current state object, for example
 * { state: 'available', version: '0.3.8', versionCode: 30899, progress: 0 }.
 */
export function getState() {
    return updateState;
}

/**
 * Whether a newer version exists, is being downloaded or has been downloaded.
 */
export function isUpdateAvailable() {
    return [ 'available', 'downloading', 'downloaded' ].includes(updateState.state);
}

/**
 * Version of the available update, or an empty string.
 */
export function getVersion() {
    return updateState.version || '';
}

/**
 * Opens the native update prompt.
 */
export function openDialog() {
    shell.openUpdateDialog();
}

/**
 * Whether the native app can run a fresh update check, as opposed to only showing the state it
 * already knows. Apps released before the manual check existed only expose the dialog.
 */
export function supportsManualCheck() {
    return typeof window !== 'undefined'
        && typeof window.NativeShell?.checkForUpdates === 'function';
}

/**
 * Asks the native side to check for updates. Nothing is shown when the installed version is current,
 * the prompt only follows when there is something to install.
 *
 * Older apps cannot check on demand, so their prompt is used instead, but only when they already
 * know about a newer version: their dialog cannot tell that nothing needs installing.
 */
export function checkForUpdates() {
    if (supportsManualCheck()) {
        shell.checkForUpdates();
        return;
    }

    if (supportsUpdateCheck() && isUpdateAvailable()) {
        shell.openUpdateDialog();
    }
}

export function addChangeListener(listener) {
    window.addEventListener(CHANGE_EVENT, listener);
}

export function removeChangeListener(listener) {
    window.removeEventListener(CHANGE_EVENT, listener);
}
