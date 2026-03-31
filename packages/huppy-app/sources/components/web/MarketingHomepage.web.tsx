import * as React from 'react';
import { getMarketingHomepageContent, MarketingHomepageLocale } from './marketingHomepageContent';

export type MarketingHomepageProps = {
    onCreateAccount?: () => void | Promise<void>;
    onOpenRestore?: () => void;
};

type SectionHeaderProps = {
    kicker: string;
    title: string;
    body: string;
};

function RabbitMark() {
    return (
        <svg width="22" height="22" viewBox="0 0 90 90" fill="none" aria-hidden="true">
            <circle cx="45" cy="54" r="24" stroke="currentColor" strokeWidth="5" />
            <line x1="33" y1="30" x2="30" y2="6" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            <line x1="57" y1="30" x2="60" y2="6" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            <circle cx="38" cy="51" r="3" fill="currentColor" />
            <circle cx="52" cy="51" r="3" fill="currentColor" />
            <path d="M38 59 Q45 63 52 59" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
        </svg>
    );
}

function SectionHeader(props: SectionHeaderProps) {
    return (
        <div className="marketing-section-header">
            <div className="marketing-section-kicker">{props.kicker}</div>
            <h2>{props.title}</h2>
            <p>{props.body}</p>
        </div>
    );
}

function AgentIcon({ label }: { label: string }) {
    const short = label === 'Claude Code'
        ? 'CC'
        : label === 'Gemini'
            ? 'G'
            : 'C';

    return <span className="marketing-agent-icon">{short}</span>;
}

export function MarketingHomepage(props: MarketingHomepageProps) {
    const [locale, setLocale] = React.useState<MarketingHomepageLocale>('en');
    const content = getMarketingHomepageContent(locale);

    const scrollToId = React.useCallback((id: string) => {
        if (typeof document === 'undefined') {
            return;
        }

        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const handleCreateAccount = React.useCallback(() => {
        void props.onCreateAccount?.();
    }, [props.onCreateAccount]);

    const handleSectionLink = React.useCallback((event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        event.preventDefault();
        scrollToId(id);
    }, [scrollToId]);

    const heroTitle = (
        <>
            {content.hero.titleLeading} <span>{content.hero.titleAccent}</span>
            {content.hero.titleTrailing}
        </>
    );

    return (
        <div className="marketing-homepage-shell">
            <div className="marketing-homepage-backdrop" />
            <div className="marketing-homepage-page">
                <header className="marketing-topbar-wrap">
                    <div className="marketing-container marketing-topbar">
                        <div className="marketing-brand">
                            <div className="marketing-brand-mark">
                                <RabbitMark />
                            </div>
                            <div className="marketing-brand-wording">
                                <div className="marketing-brand-name">Huppy</div>
                                <div className="marketing-brand-tag">{content.hero.brandLine}</div>
                            </div>
                        </div>
                        <nav className="marketing-nav-links" aria-label="Primary">
                            <a href="#how" onClick={(event) => handleSectionLink(event, 'how')}>{content.nav.how}</a>
                            <a href="#why" onClick={(event) => handleSectionLink(event, 'why')}>{content.nav.why}</a>
                            <a href="#security" onClick={(event) => handleSectionLink(event, 'security')}>{content.nav.security}</a>
                            <a href="#download" onClick={(event) => handleSectionLink(event, 'download')}>{content.nav.download}</a>
                        </nav>
                        <div className="marketing-nav-actions">
                            <div className="marketing-lang-switch" role="group" aria-label="Language switch">
                                <button
                                    type="button"
                                    className={locale === 'en' ? 'active' : ''}
                                    onClick={() => setLocale('en')}
                                >
                                    EN
                                </button>
                                <button
                                    type="button"
                                    className={locale === 'zh' ? 'active' : ''}
                                    onClick={() => setLocale('zh')}
                                >
                                    中文
                                </button>
                            </div>
                            <button type="button" className="marketing-button marketing-button-primary" onClick={props.onOpenRestore}>
                                {content.nav.cta}
                            </button>
                        </div>
                    </div>
                </header>

                <main>
                    <section className="marketing-hero" id="hero">
                        <div className="marketing-container marketing-hero-grid">
                            <div className="marketing-hero-copy">
                                <div className="marketing-eyebrow">
                                    <span className="marketing-eyebrow-dot" />
                                    <span>{content.hero.eyebrow}</span>
                                </div>
                                <h1>{heroTitle}</h1>
                                <p>{content.hero.body}</p>
                                <div className="marketing-hero-actions">
                                    <button type="button" className="marketing-button marketing-button-primary" onClick={props.onOpenRestore}>
                                        {content.hero.primaryCta}
                                    </button>
                                    <button type="button" className="marketing-button marketing-button-secondary" onClick={() => scrollToId('how')}>
                                        {content.hero.secondaryCta}
                                    </button>
                                </div>
                                <div className="marketing-brand-line">
                                    <span className="marketing-brand-line-rule" />
                                    <span>{content.hero.brandLine}</span>
                                </div>
                                <div className="marketing-trust-pills">
                                    {content.hero.trustPills.map((pill) => (
                                        <div key={pill} className="marketing-trust-pill">
                                            {pill}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="marketing-hero-visual">
                                <div className="marketing-desktop-window">
                                    <div className="marketing-desktop-topline">
                                        <div className="marketing-window-dots">
                                            <span />
                                            <span />
                                            <span />
                                        </div>
                                        <div className="marketing-window-title">
                                            <RabbitMark />
                                            <span>{content.deviceShowcase.windowTitle}</span>
                                        </div>
                                        <div className="marketing-live-chip">{content.deviceShowcase.liveChip}</div>
                                    </div>

                                    <div className="marketing-desktop-content">
                                        <aside className="marketing-session-sidebar">
                                            <div className="marketing-sidebar-label">{content.deviceShowcase.sidebarLabel}</div>
                                            <div className="marketing-session-card marketing-session-card-active">
                                                <span className="marketing-session-card-kicker">Claude Code</span>
                                                <strong>{content.deviceShowcase.panelTitle}</strong>
                                            </div>
                                            {content.deviceShowcase.sessions.map((session) => (
                                                <div key={session.title} className="marketing-session-card">
                                                    <strong>{session.title}</strong>
                                                    <span>{session.body}</span>
                                                </div>
                                            ))}
                                        </aside>

                                        <section className="marketing-main-panel">
                                            <div className="marketing-panel-card marketing-panel-summary">
                                                <div className="marketing-panel-title">{content.deviceShowcase.panelTitle}</div>
                                                <div className="marketing-panel-subtitle">{content.deviceShowcase.panelSubtitle}</div>
                                                <div className="marketing-terminal">
                                                    <div className="is-green">{content.deviceShowcase.terminalLines[0]}</div>
                                                    <div className="is-orange">{content.deviceShowcase.terminalLines[1]}</div>
                                                    <div className="is-yellow">{content.deviceShowcase.terminalLines[2]}</div>
                                                </div>
                                            </div>
                                            <div className="marketing-panel-card marketing-approval-card">
                                                <strong>{content.deviceShowcase.approvalTitle}</strong>
                                                <span>{content.deviceShowcase.approvalBody}</span>
                                                <div className="marketing-approval-actions">
                                                    <button type="button" className="marketing-pill-button is-approve">
                                                        {content.deviceShowcase.approvalPrimary}
                                                    </button>
                                                    <button type="button" className="marketing-pill-button">
                                                        {content.deviceShowcase.approvalSecondary}
                                                    </button>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    <div className="marketing-phone">
                                        <div className="marketing-phone-top">
                                            <div className="marketing-phone-notch" />
                                            <div className="marketing-phone-brand">
                                                <RabbitMark />
                                                <span>Huppy</span>
                                                <span className="marketing-phone-status">{content.deviceShowcase.phoneStatus}</span>
                                            </div>
                                        </div>
                                        <div className="marketing-phone-card">
                                            <strong>{content.deviceShowcase.phoneTitle}</strong>
                                            <span>{content.deviceShowcase.phoneBody}</span>
                                        </div>
                                        <div className="marketing-phone-agents">
                                            {content.sections.agents.cards.map((agent) => (
                                                <AgentIcon key={agent.name} label={agent.name} />
                                            ))}
                                        </div>
                                        <div className="marketing-phone-actions">
                                            <button type="button" className="marketing-phone-action marketing-phone-action-primary" onClick={props.onOpenRestore}>
                                                {content.deviceShowcase.phoneActions[0]}
                                            </button>
                                            <button type="button" className="marketing-phone-action" onClick={handleCreateAccount}>
                                                {content.deviceShowcase.phoneActions[1]}
                                            </button>
                                            <button type="button" className="marketing-phone-action" onClick={props.onOpenRestore}>
                                                {content.deviceShowcase.phoneActions[2]}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="marketing-section" id="how">
                        <div className="marketing-container">
                            <SectionHeader
                                kicker={content.sections.how.kicker}
                                title={content.sections.how.title}
                                body={content.sections.how.body}
                            />
                            <div className="marketing-step-grid">
                                {content.sections.how.steps.map((step, index) => (
                                    <article key={step.title} className="marketing-step-card">
                                        <div className="marketing-step-number">0{index + 1}</div>
                                        <h3>{step.title}</h3>
                                        <p>{step.body}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="marketing-section" id="why">
                        <div className="marketing-container marketing-why-grid">
                            <div className="marketing-why-main">
                                <SectionHeader
                                    kicker={content.sections.why.kicker}
                                    title={content.sections.why.title}
                                    body={content.sections.why.body}
                                />
                                <div className="marketing-why-card">
                                    <h3>{content.sections.why.cardTitle}</h3>
                                    <p>{content.sections.why.cardBody}</p>
                                    <div className="marketing-why-points">
                                        {content.sections.why.points.map((point) => (
                                            <div key={point.title} className="marketing-why-point">
                                                <strong>{point.title}</strong>
                                                <p>{point.body}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <aside className="marketing-quote-card">
                                <div className="marketing-quote-kicker">Huppy</div>
                                <h3>{content.sections.why.quoteTitle}</h3>
                                <p>{content.sections.why.quoteBody}</p>
                            </aside>
                        </div>
                    </section>

                    <section className="marketing-section">
                        <div className="marketing-container">
                            <SectionHeader
                                kicker={content.sections.agents.kicker}
                                title={content.sections.agents.title}
                                body={content.sections.agents.body}
                            />
                            <div className="marketing-agent-grid">
                                {content.sections.agents.cards.map((agent) => (
                                    <article key={agent.name} className="marketing-agent-card">
                                        <div className="marketing-agent-card-head">
                                            <AgentIcon label={agent.name} />
                                            <h3>{agent.name}</h3>
                                        </div>
                                        <p>{agent.body}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="marketing-section" id="security">
                        <div className="marketing-container">
                            <SectionHeader
                                kicker={content.sections.security.kicker}
                                title={content.sections.security.title}
                                body={content.sections.security.body}
                            />
                            <div className="marketing-security-grid">
                                {content.sections.security.cards.map((card) => (
                                    <article key={card.title} className="marketing-security-card">
                                        <h3>{card.title}</h3>
                                        <p>{card.body}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="marketing-section marketing-section-final" id="download">
                        <div className="marketing-container">
                            <div className="marketing-final-card">
                                <h2>{content.sections.finalCta.title}</h2>
                                <p>{content.sections.finalCta.body}</p>
                                <div className="marketing-hero-actions marketing-final-actions">
                                    <button type="button" className="marketing-button marketing-button-primary" onClick={props.onOpenRestore}>
                                        {content.sections.finalCta.primary}
                                    </button>
                                    <button type="button" className="marketing-button marketing-button-secondary" onClick={() => scrollToId('hero')}>
                                        {content.sections.finalCta.secondary}
                                    </button>
                                </div>
                                <div className="marketing-final-tertiary">
                                    <button type="button" className="marketing-inline-link" onClick={handleCreateAccount}>
                                        {content.deviceShowcase.phoneActions[1]}
                                    </button>
                                    <button type="button" className="marketing-inline-link" onClick={props.onOpenRestore}>
                                        {content.deviceShowcase.phoneActions[2]}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="marketing-footer">
                    <div className="marketing-container marketing-footer-inner">
                        <div className="marketing-brand">
                            <div className="marketing-brand-mark">
                                <RabbitMark />
                            </div>
                            <div className="marketing-brand-wording">
                                <div className="marketing-brand-name">Huppy</div>
                                <div className="marketing-brand-tag">{content.hero.brandLine}</div>
                            </div>
                        </div>
                        <div className="marketing-footer-links">
                            <a href="#download" onClick={(event) => handleSectionLink(event, 'download')}>{content.footer.privacy}</a>
                            <a href="#download" onClick={(event) => handleSectionLink(event, 'download')}>{content.footer.terms}</a>
                            <a href="#security" onClick={(event) => handleSectionLink(event, 'security')}>{content.footer.security}</a>
                            <a href="#download" onClick={(event) => handleSectionLink(event, 'download')}>{content.footer.contact}</a>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
