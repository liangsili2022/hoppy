export type TerminalAuthScheme = 'huppy' | 'happy';

const TERMINAL_AUTH_SCHEMES: TerminalAuthScheme[] = ['huppy', 'happy'];

export function buildTerminalAuthUrl(publicKeyTail: string, scheme: TerminalAuthScheme = 'huppy'): string {
    return `${scheme}://terminal?${publicKeyTail}`;
}

export function extractTerminalAuthPublicKeyTail(url: string): string | null {
    const trimmedUrl = url.trim();

    for (const scheme of TERMINAL_AUTH_SCHEMES) {
        const prefix = `${scheme}://terminal?`;
        if (trimmedUrl.startsWith(prefix)) {
            return trimmedUrl.slice(prefix.length);
        }
    }

    return null;
}

export function isTerminalAuthUrl(url: string): boolean {
    return extractTerminalAuthPublicKeyTail(url) !== null;
}
