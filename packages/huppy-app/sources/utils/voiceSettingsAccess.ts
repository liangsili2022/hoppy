export function canConfigureCustomVoiceAgent({
    isDevBuild,
    devModeEnabled,
}: {
    isDevBuild: boolean;
    devModeEnabled: boolean;
}): boolean {
    return isDevBuild || devModeEnabled;
}

export function shouldUseDirectVoiceConnection({
    isDevBuild,
    devModeEnabled,
    voiceBypassToken,
}: {
    isDevBuild: boolean;
    devModeEnabled: boolean;
    voiceBypassToken: boolean;
}): boolean {
    return voiceBypassToken && canConfigureCustomVoiceAgent({ isDevBuild, devModeEnabled });
}
