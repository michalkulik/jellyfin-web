import { useEffect, useState } from 'react';

import * as updateState from 'scripts/updateState';

/**
 * Subscribes to the state of the native in-app updater.
 *
 * Returns the current state object and whether an update is available.
 */
export const useUpdateState = () => {
    const [ state, setState ] = useState(updateState.getState());

    useEffect(() => {
        if (!updateState.supportsUpdateCheck()) return;

        setState(updateState.getState());
        updateState.init();

        const listener = () => setState(updateState.getState());
        updateState.addChangeListener(listener);

        return () => {
            updateState.removeChangeListener(listener);
        };
    }, []);

    return {
        state,
        isUpdateAvailable: updateState.isUpdateAvailable()
    };
};
