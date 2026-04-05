import React from 'react';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';
import { Text } from '@/components/StyledText';
import { getGitHubOAuthParams } from '@/sync/apiGithub';
import { t } from '@/text';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export default React.memo(function GitHubConnectScreen() {
    const { theme } = useUnistyles();
    const auth = useAuth();
    const router = useRouter();
    const [url, setUrl] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [waitingForCallback, setWaitingForCallback] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Listen for huppy://github-connected and huppy://github-error deep links
    // that the server sends back after the OAuth flow completes.
    React.useEffect(() => {
        const subscription = Linking.addEventListener('url', ({ url: incomingUrl }) => {
            if (incomingUrl.startsWith('huppy://github-connected')) {
                // Profile will auto-refresh on next sync tick; just navigate back.
                router.back();
            } else if (incomingUrl.startsWith('huppy://github-error')) {
                const params = new URL(incomingUrl);
                setError(`GitHub authorization failed: ${params.searchParams.get('code') ?? 'unknown'}`);
                setWaitingForCallback(false);
            }
        });

        return () => subscription.remove();
    }, [router]);

    const openGitHub = React.useCallback(async (targetUrl?: string | null) => {
        if (!targetUrl) {
            return;
        }

        try {
            await Linking.openURL(targetUrl);
            setError(null);
            setWaitingForCallback(true);
        } catch (openError) {
            setError(openError instanceof Error ? openError.message : 'Failed to open GitHub');
        }
    }, []);

    React.useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!auth.credentials) {
                if (!cancelled) {
                    setError('Missing credentials');
                    setLoading(false);
                }
                return;
            }

            try {
                const params = await getGitHubOAuthParams(auth.credentials);
                if (cancelled) return;
                setUrl(params.url);
                setLoading(false);
                await openGitHub(params.url);
            } catch (loadError) {
                if (cancelled) return;
                setError(loadError instanceof Error ? loadError.message : 'Failed to load GitHub connection');
                setLoading(false);
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [auth.credentials, openGitHub]);

    return (
        <View style={styles.container}>
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Text style={styles.title}>{t('settings.connectGithubAccount')}</Text>
                {loading ? (
                    <>
                        <ActivityIndicator size="small" color={theme.colors.text} />
                        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
                            {t('common.loading')}
                        </Text>
                    </>
                ) : waitingForCallback ? (
                    <>
                        <ActivityIndicator size="small" color={theme.colors.text} />
                        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
                            {'Waiting for GitHub authorization… Complete the sign-in in your browser, then return here.'}
                        </Text>
                        <Pressable
                            onPress={() => void openGitHub(url)}
                            style={({ pressed }) => [
                                styles.button,
                                { backgroundColor: theme.colors.textSecondary, opacity: pressed ? 0.85 : 1 },
                            ]}
                        >
                            <Text style={styles.buttonText}>{'Reopen GitHub'}</Text>
                        </Pressable>
                    </>
                ) : (
                    <>
                        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
                            {error
                                ? error
                                : 'GitHub authorization opens in your browser. Return to Huppy after completing the flow.'}
                        </Text>
                        <Pressable
                            onPress={() => void openGitHub(url)}
                            disabled={!url}
                            style={({ pressed }) => [
                                styles.button,
                                {
                                    backgroundColor: url ? '#24292F' : theme.colors.textSecondary,
                                    opacity: pressed ? 0.85 : 1,
                                },
                            ]}
                        >
                            <Text style={styles.buttonText}>{t('settings.connectGithubAccount')}</Text>
                        </Pressable>
                    </>
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
    },
    card: {
        borderRadius: 20,
        padding: 24,
        gap: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.text,
        textAlign: 'center',
    },
    body: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    button: {
        minHeight: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
}));
