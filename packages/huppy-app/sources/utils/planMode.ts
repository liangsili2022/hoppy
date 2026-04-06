import type { Message } from '@/sync/typesMessage';
import type { NormalizedMessage } from '@/sync/typesRaw';

const PLAN_ENTRY_TOOL_NAMES = new Set(['EnterPlanMode', 'enter_plan_mode']);
const PLAN_EXIT_TOOL_NAMES = new Set(['ExitPlanMode', 'exit_plan_mode']);

export function isPlanEntryToolName(toolName: string): boolean {
    return PLAN_ENTRY_TOOL_NAMES.has(toolName);
}

export function isPlanExitToolName(toolName: string): boolean {
    return PLAN_EXIT_TOOL_NAMES.has(toolName);
}

export function getApprovedModeForTool(toolName: string): 'default' | undefined {
    if (isPlanExitToolName(toolName)) {
        return 'default';
    }
    return undefined;
}

export function resolvePlanModeTransition(
    incomingMessages: NormalizedMessage[],
    processedMessages: Message[],
): 'default' | 'plan' | null {
    const shouldExitPlanMode = processedMessages.some((message) =>
        message.kind === 'tool-call'
        && isPlanExitToolName(message.tool.name)
        && message.tool.permission?.status === 'approved',
    );

    if (shouldExitPlanMode) {
        return 'default';
    }

    const shouldEnterPlanMode = incomingMessages.some((message) =>
        message.role === 'agent'
        && message.content.some((content) =>
            content.type === 'tool-call'
            && isPlanEntryToolName(content.name),
        ),
    );

    if (shouldEnterPlanMode) {
        return 'plan';
    }

    return null;
}
