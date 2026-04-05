export function buildTerminalAuthUrl(publicKeyTail: string): string {
    return `huppy://terminal?${publicKeyTail}`;
}
