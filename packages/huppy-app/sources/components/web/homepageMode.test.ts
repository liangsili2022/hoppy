import { describe, expect, it } from 'vitest';
import { getHomepageMode } from './homepageMode';

describe('getHomepageMode', () => {
    it('shows the marketing homepage for unauthenticated web users', () => {
        expect(getHomepageMode({ isAuthenticated: false, platform: 'web' })).toBe('marketing');
    });

    it('keeps the native welcome screen for unauthenticated native users', () => {
        expect(getHomepageMode({ isAuthenticated: false, platform: 'ios' })).toBe('welcome');
        expect(getHomepageMode({ isAuthenticated: false, platform: 'android' })).toBe('welcome');
    });

    it('always sends authenticated users to the main app', () => {
        expect(getHomepageMode({ isAuthenticated: true, platform: 'web' })).toBe('app');
        expect(getHomepageMode({ isAuthenticated: true, platform: 'ios' })).toBe('app');
    });
});
