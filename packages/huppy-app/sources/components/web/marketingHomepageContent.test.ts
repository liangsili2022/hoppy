import { describe, expect, it } from 'vitest';
import { getMarketingHomepageContent } from './marketingHomepageContent';

describe('getMarketingHomepageContent', () => {
    it('returns English content by default', () => {
        const content = getMarketingHomepageContent('en');

        expect(content.hero.primaryCta).toBe('Get Started');
        expect(content.nav.how).toBe('How it works');
    });

    it('returns localized Chinese labels where required', () => {
        const content = getMarketingHomepageContent('zh');

        expect(content.hero.primaryCta).toBe('开始使用');
        expect(content.sections.security.title).toBe('把控制权留在你手里。');
    });

    it('keeps the slogan in English in both locales', () => {
        expect(getMarketingHomepageContent('en').hero.brandLine).toBe('Hope U Pursue Passion Youthfully');
        expect(getMarketingHomepageContent('zh').hero.brandLine).toBe('Hope U Pursue Passion Youthfully');
    });
});
