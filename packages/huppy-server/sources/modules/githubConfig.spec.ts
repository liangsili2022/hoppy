import { afterEach, describe, expect, it, vi } from "vitest";
import {
    buildGithubOAuthAuthorizeUrl,
    getGithubOAuthConfig,
    getGithubRedirectUri
} from "./githubConfig";

afterEach(() => {
    vi.unstubAllEnvs();
});

describe("githubConfig", () => {
    it("prefers GITHUB_REDIRECT_URI", () => {
        vi.stubEnv("GITHUB_REDIRECT_URI", "https://api.huppy.ai/v1/connect/github/callback");
        vi.stubEnv("GITHUB_REDIRECT_URL", "https://example.com/legacy");

        expect(getGithubRedirectUri()).toBe("https://api.huppy.ai/v1/connect/github/callback");
    });

    it("falls back to GITHUB_REDIRECT_URL", () => {
        vi.stubEnv("GITHUB_REDIRECT_URL", "https://api.huppy.ai/v1/connect/github/callback");

        expect(getGithubRedirectUri()).toBe("https://api.huppy.ai/v1/connect/github/callback");
    });

    it("returns null when oauth config is incomplete", () => {
        vi.stubEnv("GITHUB_CLIENT_ID", "client-id");

        expect(getGithubOAuthConfig()).toBeNull();
    });

    it("builds an authorize url without oauth scopes", () => {
        const url = buildGithubOAuthAuthorizeUrl({
            clientId: "client-id",
            redirectUri: "https://api.huppy.ai/v1/connect/github/callback",
            state: "state-token"
        });

        const parsed = new URL(url);
        expect(parsed.origin + parsed.pathname).toBe("https://github.com/login/oauth/authorize");
        expect(parsed.searchParams.get("client_id")).toBe("client-id");
        expect(parsed.searchParams.get("redirect_uri")).toBe("https://api.huppy.ai/v1/connect/github/callback");
        expect(parsed.searchParams.get("state")).toBe("state-token");
        expect(parsed.searchParams.get("scope")).toBeNull();
    });
});
