type ToolLike = {
    name: string;
    input?: any;
    description?: string | null;
};

const DIRECT_TITLE_CHANGE_TOOL_NAMES = new Set([
    'change_title',
    'happy__change_title',
    'huppy__change_title',
    'mcp__happy__change_title',
    'mcp__huppy__change_title',
]);

const TITLE_CHANGE_COMMAND_PATTERN = /\b(?:happy|huppy)\s+--change_title\b/i;
const TITLE_CHANGE_FUNCTION_PATTERN = /\b(?:functions\.|mcp__)?(?:happy|huppy)__change_title\b/i;

function stringifyCommand(command: unknown): string | null {
    if (typeof command === 'string') {
        const trimmed = command.trim();
        return trimmed.length > 0 ? trimmed : null;
    }

    if (Array.isArray(command)) {
        const parts = command
            .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
            .map((part) => part.trim());
        return parts.length > 0 ? parts.join(' ') : null;
    }

    return null;
}

/**
 * Collects the actual command strings from a tool call for pattern matching.
 * Only includes fields that contain real command invocations (name, input.command,
 * input.parsed_cmd). Deliberately excludes description and title fields — those are
 * user-facing documentation strings that could accidentally match the pattern and
 * cause legitimate tools to be filtered out.
 */
function collectCandidates(tool: ToolLike): string[] {
    const candidates: string[] = [tool.name];

    const command = stringifyCommand(tool.input?.command);
    if (command) {
        candidates.push(command);
    }

    if (Array.isArray(tool.input?.parsed_cmd)) {
        for (const parsed of tool.input.parsed_cmd) {
            if (typeof parsed?.cmd === 'string' && parsed.cmd.trim().length > 0) {
                candidates.push(parsed.cmd.trim());
            }
        }
    }

    return candidates;
}

export function isInternalTitleChangeToolCall(tool: ToolLike): boolean {
    if (DIRECT_TITLE_CHANGE_TOOL_NAMES.has(tool.name)) {
        return true;
    }

    return collectCandidates(tool).some((candidate) =>
        TITLE_CHANGE_COMMAND_PATTERN.test(candidate) || TITLE_CHANGE_FUNCTION_PATTERN.test(candidate)
    );
}
