export type HomepageMode = 'app' | 'welcome' | 'marketing';

export function getHomepageMode(props: {
    isAuthenticated: boolean;
    platform: string;
}): HomepageMode {
    if (props.isAuthenticated) {
        return 'app';
    }

    if (props.platform === 'web') {
        return 'marketing';
    }

    return 'welcome';
}
