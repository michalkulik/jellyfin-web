import shell from './shell';

const ACTIVE_STATES = ['queued', 'converting', 'downloading'];
const NATIVE_CHANGE_EVENT = 'downloadstatechange';
const CHANGE_EVENT = 'downloadstatechange-local';

let states = {};
let initialized = false;

function supportsDownloadState() {
    return typeof window !== 'undefined'
        && typeof window.NativeShell?.getDownloadInfo === 'function';
}

/**
 * Refreshes the cached download state from the native shell.
 */
export async function refresh() {
    if (!supportsDownloadState()) return;

    try {
        states = await window.NativeShell.getDownloadInfo() || {};
    } catch (err) {
        console.error('Failed to read download state', err);
        states = {};
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Initializes the download state and subscribes to native state changes.
 */
export function init() {
    if (initialized || typeof window === 'undefined') return;
    initialized = true;

    window.addEventListener(NATIVE_CHANGE_EVENT, refresh);
    refresh();
}

/**
 * Returns the raw state of an item or undefined when the item has no download.
 */
export function getState(itemId) {
    return states[itemId];
}

/**
 * Whether the item is fully downloaded to the device.
 */
export function isDownloaded(itemId) {
    return states[itemId] === 'downloaded';
}

/**
 * Whether the item is queued, converting or downloading.
 */
export function isDownloading(itemId) {
    return ACTIVE_STATES.includes(states[itemId]);
}

export function addChangeListener(listener) {
    window.addEventListener(CHANGE_EVENT, listener);
}

export function removeChangeListener(listener) {
    window.removeEventListener(CHANGE_EVENT, listener);
}

/**
 * Opens the native download manager.
 */
export function openDownloads() {
    shell.openDownloadManager();
}
