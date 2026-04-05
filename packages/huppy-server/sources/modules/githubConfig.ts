export interface GithubOAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export function getGithubRedirectUri(): string | null {
    return process.env.GITHUB_REDIRECT_URI ?? process.env.GITHUB_REDIRECT_URL ?? null;
}

export function getGithubOAuthConfig(): GithubOAuthConfig | null {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = getGithubRedirectUri();

    if (!clientId || !clientSecret || !redirectUri) {
        return null;
    }

    return {
        clientId,
        clientSecret,
        redirectUri
    };
}

export function buildGithubOAuthAuthorizeUrl(input: {
    clientId: string;
    redirectUri: string;
    state: string;
}): string {
    const params = new URLSearchParams({
        client_id: input.clientId,
        redirect_uri: input.redirectUri,
        state: input.state
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}
