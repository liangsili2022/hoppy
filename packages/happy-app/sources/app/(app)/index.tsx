import { RoundButton } from "@/components/RoundButton";
import { useAuth } from "@/auth/AuthContext";
import { Text, View, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as React from 'react';
import { encodeBase64 } from "@/encryption/base64";
import { authGetToken } from "@/auth/authGetToken";
import { router, useRouter } from "expo-router";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { getRandomBytesAsync } from "expo-crypto";
import { useIsLandscape } from "@/utils/responsive";
import { Typography } from "@/constants/Typography";
import { trackAccountCreated, trackAccountRestored } from '@/track';
import { HomeHeaderNotAuth } from "@/components/HomeHeader";
import { MainView } from "@/components/MainView";
import { t } from '@/text';

// Hoppy bunny — exactly as shown in Option C mockup
function HoppyBunnySvg() {
    if (Platform.OS === 'web') {
        return (
            <View style={logoStyles.svgWrap}>
                {/* @ts-ignore web-only SVG */}
                <svg width="90" height="90" viewBox="0 0 90 90" fill="none"
                    style={{ filter: 'drop-shadow(0 0 12px #FF9A3C99)' }}>
                    <circle cx="45" cy="54" r="24" stroke="#FF9A3C" strokeWidth="1.5"/>
                    <line x1="33" y1="30" x2="30" y2="6" stroke="#FF9A3C" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="57" y1="30" x2="60" y2="6" stroke="#FF9A3C" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="38" cy="51" r="3" fill="#FF9A3C"/>
                    <circle cx="52" cy="51" r="3" fill="#FF9A3C"/>
                    <path d="M38 59 Q45 63 52 59" stroke="#FF9A3C" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    <rect x="34" y="64" width="22" height="13" rx="2" stroke="#FF9A3C55" strokeWidth="1"/>
                    <line x1="29" y1="77" x2="61" y2="77" stroke="#FF9A3C44" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
            </View>
        );
    }
    return (
        <View style={logoStyles.glowRing}>
            <Text style={{ fontSize: 48 }}>🐰</Text>
        </View>
    );
}

function HoppyLogo() {
    return (
        <View style={logoStyles.wrap}>
            <HoppyBunnySvg />
            <Text style={logoStyles.name}>HOPPY</Text>
            <Text style={logoStyles.tagline}>AI Agent Controller</Text>
        </View>
    );
}

// AI badge chips
function AiBadges() {
    return (
        <View style={badgeStyles.row}>
            {[
                { label: 'Claude', color: '#CC785C' },
                { label: 'Gemini', color: '#4285F4' },
                { label: 'Codex',  color: '#9747FF' },
            ].map(({ label, color }) => (
                <View key={label} style={[badgeStyles.chip, { borderColor: color + '66', backgroundColor: color + '11' }]}>
                    <Text style={[badgeStyles.chipText, { color }]}>{label}</Text>
                </View>
            ))}
        </View>
    );
}

export default function Home() {
    const auth = useAuth();
    if (!auth.isAuthenticated) {
        return <NotAuthenticated />;
    }
    return (
        <Authenticated />
    )
}

function Authenticated() {
    return <MainView variant="phone" />;
}

function NotAuthenticated() {
    const { theme } = useUnistyles();
    const auth = useAuth();
    const router = useRouter();
    const isLandscape = useIsLandscape();
    const insets = useSafeAreaInsets();

    const createAccount = async () => {
        try {
            const secret = await getRandomBytesAsync(32);
            const token = await authGetToken(secret);
            if (token && secret) {
                await auth.login(token, encodeBase64(secret, 'base64url'));
                trackAccountCreated();
            }
        } catch (error) {
            console.error('Error creating account', error);
        }
    }

    const portraitLayout = (
        <View style={styles.portraitContainer}>
            <HoppyLogo />
            <AiBadges />
            <Text style={styles.subtitle}>
                {t('welcome.subtitle')}
            </Text>
            {Platform.OS !== 'android' && Platform.OS !== 'ios' ? (
                <>
                    <View style={styles.buttonContainer}>
                        <RoundButton
                            title={t('welcome.loginWithMobileApp')}
                            onPress={() => {
                                trackAccountRestored();
                                router.push('/restore');
                            }}
                        />
                    </View>
                    <View style={styles.buttonContainerSecondary}>
                        <RoundButton
                            size="normal"
                            title={t('welcome.createAccount')}
                            action={createAccount}
                            display="inverted"
                        />
                    </View>
                </>
            ) : (
                <>
                    <View style={styles.buttonContainer}>
                        <RoundButton
                            title={t('welcome.createAccount')}
                            action={createAccount}
                        />
                    </View>
                    <View style={styles.buttonContainerSecondary}>
                        <RoundButton
                            size="normal"
                            title={t('welcome.linkOrRestoreAccount')}
                            onPress={() => {
                                trackAccountRestored();
                                router.push('/restore');
                            }}
                            display="inverted"
                        />
                    </View>
                </>
            )}
        </View>
    );

    const landscapeLayout = (
        <View style={[styles.landscapeContainer, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.landscapeInner}>
                <View style={styles.landscapeLogoSection}>
                    <HoppyLogo />
                    <AiBadges />
                </View>
                <View style={styles.landscapeContentSection}>
                    <Text style={styles.landscapeTitle}>
                        {t('welcome.title')}
                    </Text>
                    <Text style={styles.landscapeSubtitle}>
                        {t('welcome.subtitle')}
                    </Text>
                    {Platform.OS !== 'android' && Platform.OS !== 'ios'
                        ? (<>
                            <View style={styles.landscapeButtonContainer}>
                                <RoundButton
                                    title={t('welcome.loginWithMobileApp')}
                                    onPress={() => {
                                        trackAccountRestored();
                                        router.push('/restore');
                                    }}
                                />
                            </View>
                            <View style={styles.landscapeButtonContainerSecondary}>
                                <RoundButton
                                    size="normal"
                                    title={t('welcome.createAccount')}
                                    action={createAccount}
                                    display="inverted"
                                />
                            </View>
                        </>)
                        : (<>
                            <View style={styles.landscapeButtonContainer}>
                                <RoundButton
                                    title={t('welcome.createAccount')}
                                    action={createAccount}
                                />
                            </View>
                            <View style={styles.landscapeButtonContainerSecondary}>
                                <RoundButton
                                    size="normal"
                                    title={t('welcome.linkOrRestoreAccount')}
                                    onPress={() => {
                                        trackAccountRestored();
                                        router.push('/restore');
                                    }}
                                    display="inverted"
                                />
                            </View>
                        </>)
                    }
                </View>
            </View>
        </View>
    );

    return (
        <>
            <HomeHeaderNotAuth />
            {isLandscape ? landscapeLayout : portraitLayout}
        </>
    )
}

// Hoppy logo styles
const logoStyles = StyleSheet.create(() => ({
    wrap: { alignItems: 'center', marginBottom: 8 },
    svgWrap: { marginBottom: 12, alignItems: 'center' },
    glowRing: {
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 1.5, borderColor: '#FF9A3C66',
        backgroundColor: '#FF9A3C0A',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#FF9A3C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
    },
    innerCircle: { alignItems: 'center' },
    name: {
        fontSize: 28, fontWeight: '800', letterSpacing: 6,
        color: '#FF9A3C',
        textShadowColor: '#FF9A3C88',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
        marginBottom: 4,
    },
    tagline: { fontSize: 11, color: '#FF9A3C66', letterSpacing: 2, textTransform: 'uppercase' },
}));

// AI badge styles
const badgeStyles = StyleSheet.create(() => ({
    row: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 4 },
    chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
}));

const styles = StyleSheet.create((theme) => ({
    // NotAuthenticated styles
    portraitContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#080808',
    },
    logo: {
        width: 300,
        height: 90,
    },
    title: {
        marginTop: 16,
        textAlign: 'center',
        fontSize: 24,
        ...Typography.default('semiBold'),
        color: theme.colors.text,
    },
    subtitle: {
        ...Typography.default(),
        fontSize: 15,
        color: '#666666',
        marginTop: 20,
        textAlign: 'center',
        marginHorizontal: 32,
        marginBottom: 40,
        lineHeight: 22,
    },
    buttonContainer: {
        maxWidth: 280,
        width: '100%',
        marginBottom: 16,
    },
    buttonContainerSecondary: {
    },
    // Landscape styles
    landscapeContainer: {
        flexBasis: 0,
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 48,
        backgroundColor: '#080808',
    },
    landscapeInner: {
        flexGrow: 1,
        flexBasis: 0,
        maxWidth: 800,
        flexDirection: 'row',
    },
    landscapeLogoSection: {
        flexBasis: 0,
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 24,
    },
    landscapeContentSection: {
        flexBasis: 0,
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 24,
    },
    landscapeTitle: {
        textAlign: 'center',
        fontSize: 24,
        ...Typography.default('semiBold'),
        color: '#F0F0F0',
    },
    landscapeSubtitle: {
        ...Typography.default(),
        fontSize: 18,
        color: '#666666',
        marginTop: 16,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    landscapeButtonContainer: {
        width: 280,
        marginBottom: 16,
    },
    landscapeButtonContainerSecondary: {
        width: 280,
    },
}));