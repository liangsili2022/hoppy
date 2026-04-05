export type SettingsConnectProvider = 'claude' | 'github';

const SETTINGS_CONNECT_ROUTES = {
    claude: '/settings/connect/claude',
    github: '/settings/connect/github',
} as const;

export function getSettingsConnectRoute(provider: SettingsConnectProvider): (typeof SETTINGS_CONNECT_ROUTES)[SettingsConnectProvider] {
    return SETTINGS_CONNECT_ROUTES[provider];
}
