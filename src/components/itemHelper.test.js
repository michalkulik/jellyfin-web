import { describe, expect, it, vi } from 'vitest';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key, ...args) => [key, ...args].join(' ')
    }
}));

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {}
}));

vi.mock('components/apphost', () => ({
    appHost: {}
}));

vi.mock('./apphost', () => ({
    appHost: {}
}));

import { getDisplayName } from './itemHelper';

describe('getDisplayName', () => {
    it('shows the episode number of a guide programme that carries no season', () => {
        expect(getDisplayName({
            Type: 'Program',
            Name: 'Była sobie Ziemia',
            EpisodeTitle: 'Recykling',
            IndexNumber: 18,
            ParentIndexNumber: null
        })).toBe('E18 - Recykling');
    });

    it('keeps the season/episode pair when the guide reports both', () => {
        expect(getDisplayName({
            Type: 'Program',
            Name: 'Była sobie Ziemia',
            EpisodeTitle: 'Recykling',
            IndexNumber: 18,
            ParentIndexNumber: 1
        })).toBe('S1:E18 - Recykling');
    });

    it('shows the episode number of a scheduled timer', () => {
        expect(getDisplayName({
            Type: 'Timer',
            Name: 'Była sobie Ziemia',
            ProgramInfo: {
                Type: 'Program',
                Name: 'Była sobie Ziemia',
                EpisodeTitle: 'Klimat - skutki ocieplenia',
                IndexNumber: 17,
                ParentIndexNumber: null
            }
        })).toBe('E17 - Klimat - skutki ocieplenia');
    });

    it('leaves episodes without a season unnumbered', () => {
        expect(getDisplayName({
            Type: 'Episode',
            Name: 'Pilot',
            IndexNumber: 3,
            ParentIndexNumber: null
        })).toBe('Pilot');
    });

    it('leaves programmes without an episode number unnumbered', () => {
        expect(getDisplayName({
            Type: 'Program',
            Name: 'Wiadomości',
            IsSeries: false,
            EpisodeTitle: null,
            IndexNumber: null
        })).toBe('Wiadomości');
    });
});
