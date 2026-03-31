export type MarketingHomepageLocale = 'en' | 'zh';

const BRAND_LINE = 'Hope U Pursue Passion Youthfully';

const CONTENT = {
    en: {
        nav: {
            how: 'How it works',
            why: 'Why Huppy',
            security: 'Security',
            download: 'Get Started',
            cta: 'Get Started',
        },
        hero: {
            eyebrow: 'Mobile control for coding agents',
            titleLeading: 'Stay close to your',
            titleAccent: 'Codex and Claude Code',
            titleTrailing: ", even when you're away from your desk.",
            body: 'Huppy lets you view live sessions on your phone and step in when your AI needs you.',
            primaryCta: 'Get Started',
            secondaryCta: 'See How It Works',
            brandLine: BRAND_LINE,
            trustPills: [
                'End-to-end encrypted flow',
                'Approve sensitive actions remotely',
                'Built for developers, not tourists',
            ],
        },
        deviceShowcase: {
            windowTitle: 'Huppy · connected',
            liveChip: 'Live session',
            sidebarLabel: 'Active session',
            sessions: [
                {
                    title: 'Feature polish',
                    body: 'Waiting for approval on `deploy/web.ts`',
                },
                {
                    title: 'Backend sync',
                    body: 'Codex is still applying patch set 3',
                },
                {
                    title: 'Docs cleanup',
                    body: 'Gemini finished summarizing changes',
                },
            ],
            panelTitle: 'Homepage redesign · Claude Code',
            panelSubtitle: 'Live output mirrored to your phone while you are away.',
            terminalLines: [
                '✓ Connected to MacBook Pro and synced session state',
                '→ Claude is refactoring the homepage hero and CTA section',
                '! Approval required: apply visual changes to production route',
            ],
            approvalTitle: 'Your AI needs a quick decision',
            approvalBody: 'See the diff, approve the action, or send a new instruction from your phone.',
            approvalPrimary: 'Approve action',
            approvalSecondary: 'Review output',
            phoneStatus: 'Mobile client',
            phoneTitle: 'Codex and Claude Code mobile client',
            phoneBody: 'End-to-end encrypted and your account is stored only on your device.',
            phoneActions: [
                'Login with mobile app',
                'Create account',
                'Link or restore account',
            ],
        },
        sections: {
            how: {
                kicker: 'How it works',
                title: 'A simple bridge between your desk and your phone.',
                body: 'Huppy is built for developers who are still shaping their AI workflow. It explains itself fast and gets out of the way.',
                steps: [
                    {
                        title: 'Connect your Mac',
                        body: 'Pair your machine once, then keep every live coding session within reach.',
                    },
                    {
                        title: 'Watch sessions live',
                        body: 'See what Codex, Claude Code, or Gemini is doing without staying glued to your monitor.',
                    },
                    {
                        title: 'Take over when needed',
                        body: 'Approve sensitive actions, add a new instruction, or jump back in before the thread goes cold.',
                    },
                ],
            },
            why: {
                kicker: 'Why Huppy',
                title: 'Not another AI IDE.',
                body: 'Huppy is the mobile control layer for coding agents already running on your machine. It helps you stay connected to work in progress without forcing you into a new editor.',
                cardTitle: 'Made for real sessions, not a demo fantasy',
                cardBody: 'The interface is centered around active work: live output, pending approvals, and quick intervention. You should be able to glance at your phone and understand whether your AI is moving, waiting, or blocked.',
                points: [
                    {
                        title: 'Built around real session state',
                        body: 'See what is running, what finished, and what needs you next.',
                    },
                    {
                        title: 'Made for stepping away without disconnecting',
                        body: 'The moment you leave your desk should not be the moment your context falls apart.',
                    },
                    {
                        title: 'Simple enough for new AI workflows',
                        body: 'You do not need a perfect agent setup before Huppy becomes useful.',
                    },
                ],
                quoteTitle: 'What the product should feel like',
                quoteBody: 'Calm when you need confidence. Fast when your AI needs a decision. Warm enough to feel approachable, sharp enough to trust with work in progress.',
            },
            agents: {
                kicker: 'Supported agents',
                title: 'Works with the agents you already know.',
                body: 'One mobile surface for the sessions you already run on desktop.',
                cards: [
                    { name: 'Codex', body: 'Keep long-running coding sessions visible when you leave your keyboard.' },
                    { name: 'Claude Code', body: 'Approve actions, watch output, and step in before the thread loses momentum.' },
                    { name: 'Gemini', body: 'Manage multiple agent workflows from one calm, readable companion surface.' },
                ],
            },
            security: {
                kicker: 'Trust & security',
                title: 'Built to keep you in control.',
                body: 'The trust layer should be obvious, not buried. Huppy keeps sensitive decisions close to you while your sessions keep moving.',
                cards: [
                    {
                        title: 'Encrypted session flow',
                        body: 'Communication is designed around end-to-end encrypted session flow, so your live work stays protected in transit.',
                    },
                    {
                        title: 'Remote approval where it matters',
                        body: 'Sensitive actions still require a human decision, even when the session is running remotely.',
                    },
                    {
                        title: 'Close to your devices',
                        body: 'Credentials and session context stay as close to your actual devices and workflow as possible.',
                    },
                ],
            },
            finalCta: {
                title: 'Your AI keeps working. You stay in control.',
                body: 'Use Huppy to stay connected to your coding sessions, even when you are away from your desk.',
                primary: 'Get Started',
                secondary: 'View Demo',
            },
        },
        footer: {
            privacy: 'Privacy',
            terms: 'Terms',
            security: 'Security',
            contact: 'Contact',
        },
    },
    zh: {
        nav: {
            how: '工作方式',
            why: '为什么是 Huppy',
            security: '安全',
            download: '开始使用',
            cta: '开始使用',
        },
        hero: {
            eyebrow: '给编程智能体用的移动控制层',
            titleLeading: '离开电脑，也别离开你的',
            titleAccent: 'Codex 和 Claude Code',
            titleTrailing: '。',
            body: 'Huppy 让你在手机上查看实时会话，并在 AI 需要你时随时接管。',
            primaryCta: '开始使用',
            secondaryCta: '查看工作方式',
            brandLine: BRAND_LINE,
            trustPills: [
                '端到端加密会话流',
                '远程批准敏感操作',
                '给开发者用，不是给围观者用',
            ],
        },
        deviceShowcase: {
            windowTitle: 'Huppy · 已连接',
            liveChip: '实时会话',
            sidebarLabel: '当前会话',
            sessions: [
                {
                    title: '功能打磨',
                    body: '正在等待你批准 `deploy/web.ts`',
                },
                {
                    title: '后端同步',
                    body: 'Codex 仍在应用第 3 组补丁',
                },
                {
                    title: '文档整理',
                    body: 'Gemini 已完成本轮变更总结',
                },
            ],
            panelTitle: '官网首页改版 · Claude Code',
            panelSubtitle: '你离开工位时，实时输出仍会同步到手机。',
            terminalLines: [
                '✓ 已连接 MacBook Pro，并同步当前会话状态',
                '→ Claude 正在重构首页 Hero 与 CTA 模块',
                '! 需要批准：将视觉修改应用到生产路由',
            ],
            approvalTitle: '你的 AI 现在需要一个决定',
            approvalBody: '你可以在手机上查看 diff、批准操作，或者补一条新指令。',
            approvalPrimary: '批准操作',
            approvalSecondary: '查看输出',
            phoneStatus: '移动客户端',
            phoneTitle: 'Codex 和 Claude Code 移动客户端',
            phoneBody: '端到端加密，您的账户仅存储在您的设备上。',
            phoneActions: [
                '使用移动应用登录',
                '创建账户',
                '链接或恢复账户',
            ],
        },
        sections: {
            how: {
                kicker: '工作方式',
                title: '在电脑和手机之间，搭一座简单的桥。',
                body: 'Huppy 为已经在使用 Codex 和 Claude Code 的开发者而设计。',
                steps: [
                    {
                        title: '连接你的 Mac',
                        body: '配对一次，你的实时编程会话就能一直保持在可触达范围内。',
                    },
                    {
                        title: '实时查看会话',
                        body: '不用盯着显示器，也能知道 Codex、Claude Code 或 Gemini 正在做什么。',
                    },
                    {
                        title: '需要时马上接管',
                        body: '批准敏感操作、补一条新指令，或者在上下文变冷之前重新接管。',
                    },
                ],
            },
            why: {
                kicker: '为什么是 Huppy',
                title: '它不是另一个 AI IDE。',
                body: 'Huppy 是运行在你电脑上的编程智能体的移动控制层。它让你和进行中的工作保持连接，而不是逼你迁移到一个新编辑器里。',
                cardTitle: '围绕真实会话设计，不是为了演示拼出来的假场景',
                cardBody: '界面的中心不是炫技，而是活跃工作本身：实时输出、待批准操作、以及随时可介入的控制点。你应该在看手机的一眼之间，就知道 AI 是在前进、等待，还是卡住了。',
                points: [
                    {
                        title: '围绕真实会话状态构建',
                        body: '知道什么正在运行，什么已经结束，下一步哪里需要你。',
                    },
                    {
                        title: '为“离开工位但不断线”而做',
                        body: '你离开电脑，不该等于你和上下文断开。',
                    },
                    {
                        title: '对新 AI 工作流也足够友好',
                        body: '你不需要先把 agent 工作流搭到完美，Huppy 也能立刻产生价值。',
                    },
                ],
                quoteTitle: '它应该给人的感觉',
                quoteBody: '当你需要信任感时足够冷静，当 AI 需要一个决定时足够快。既温和到愿意打开，又锋利到值得托付进行中的工作。',
            },
            agents: {
                kicker: '支持的智能体',
                title: '兼容你已经熟悉的那些智能体。',
                body: '把你已经在桌面端使用的会话，收束到一个移动控制界面里。',
                cards: [
                    { name: 'Codex', body: '长时间运行的编程会话，在你离开键盘后也依然可见。' },
                    { name: 'Claude Code', body: '批准操作、查看输出，并在节奏掉下去之前重新接管。' },
                    { name: 'Gemini', body: '把多个智能体工作流收进一个平静、清晰的移动伴侣界面。' },
                ],
            },
            security: {
                kicker: '信任与安全',
                title: '把控制权留在你手里。',
                body: '信任层应该一眼看见，而不是藏在脚注里。Huppy 让会话继续前进，也让关键决定始终靠近你。',
                cards: [
                    {
                        title: '加密的会话流',
                        body: '通信链路围绕端到端加密的会话流设计，让进行中的工作在传输过程中保持受保护状态。',
                    },
                    {
                        title: '关键操作仍需人工批准',
                        body: '即使会话远程运行，敏感动作仍然需要一个真实的人来点头。',
                    },
                    {
                        title: '尽可能贴近你的设备',
                        body: '凭证与上下文尽量靠近你的真实设备和现有工作流，不凭空增加新的暴露面。',
                    },
                ],
            },
            finalCta: {
                title: '让 AI 持续工作，也让你持续掌控。',
                body: '用 Huppy 把你的编程会话带在身边，即使你离开了电脑。',
                primary: '开始使用',
                secondary: '查看演示',
            },
        },
        footer: {
            privacy: '隐私',
            terms: '条款',
            security: '安全',
            contact: '联系',
        },
    },
} as const;

export type MarketingHomepageContent = (typeof CONTENT)[MarketingHomepageLocale];

export function getMarketingHomepageContent(locale: MarketingHomepageLocale): MarketingHomepageContent {
    return CONTENT[locale] ?? CONTENT.en;
}
