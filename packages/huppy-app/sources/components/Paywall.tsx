import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/components/StyledText';
import { t } from '@/text';
import { RevenueCat, PaywallResult, Product } from '@/sync/revenueCat';
import { storage } from '@/sync/storage';
import { PaywallManager } from './PaywallManager';
import { trackPaywallCancelled, trackPaywallError, trackPaywallPresented, trackPaywallPurchased, trackPaywallRestored } from '@/track';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaywallProps {
    onClose: (result: PaywallResult) => void;
}

// ─── Host (mount in root layout) ─────────────────────────────────────────────

export function PaywallHost() {
    const [visible, setVisible] = useState(false);
    const resolveRef = useRef<((result: PaywallResult) => void) | null>(null);

    useEffect(() => {
        PaywallManager.setShowFn((resolve) => {
            resolveRef.current = resolve;
            setVisible(true);
            trackPaywallPresented();
        });

        return () => {
            PaywallManager.setShowFn(null);
        };
    }, []);

    const handleClose = useCallback((result: PaywallResult) => {
        setVisible(false);
        if (result === PaywallResult.CANCELLED) {
            trackPaywallCancelled();
        } else if (result === PaywallResult.PURCHASED) {
            trackPaywallPurchased();
        } else if (result === PaywallResult.RESTORED) {
            trackPaywallRestored();
        }
        resolveRef.current?.(result);
        resolveRef.current = null;
    }, []);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
            onRequestClose={() => handleClose(PaywallResult.CANCELLED)}
        >
            <PaywallScreen onClose={handleClose} />
        </Modal>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const WEEKLY_ID = 'ai.huppy.plus.weekly';
const YEARLY_ID = 'ai.huppy.plus.yearly';

const WEEKLY_PRICE_DISPLAY = '¥15';
const YEARLY_PRICE_DISPLAY = '¥298';
const YEARLY_PER_WEEK = '¥5.73';
const SAVE_PERCENT = '62%';
type BillingPlan = 'weekly' | 'yearly';

function PaywallScreen({ onClose }: PaywallProps) {
    const insets = useSafeAreaInsets();
    const [weeklyProduct, setWeeklyProduct] = useState<Product | null>(null);
    const [yearlyProduct, setYearlyProduct] = useState<Product | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<BillingPlan>('yearly');
    const [weeklyPrice, setWeeklyPrice] = useState(WEEKLY_PRICE_DISPLAY);
    const [yearlyPrice, setYearlyPrice] = useState(YEARLY_PRICE_DISPLAY);
    const [loading, setLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(true);

    // Load real prices from RevenueCat
    useEffect(() => {
        (async () => {
            try {
                const products = await RevenueCat.getProducts([WEEKLY_ID, YEARLY_ID]);
                const weekly = products.find(p => p.identifier === WEEKLY_ID);
                const yearly = products.find(p => p.identifier === YEARLY_ID);
                if (weekly) {
                    setWeeklyPrice(weekly.priceString);
                    setWeeklyProduct(weekly);
                }
                if (yearly) {
                    setYearlyPrice(yearly.priceString);
                    setYearlyProduct(yearly);
                }
            } catch (e) {
                // Use fallback display prices
            } finally {
                setProductsLoading(false);
            }
        })();
    }, []);

    const handlePurchase = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            let product = selectedPlan === 'weekly' ? weeklyProduct : yearlyProduct;
            if (!product) {
                const products = await RevenueCat.getProducts([selectedPlan === 'weekly' ? WEEKLY_ID : YEARLY_ID]);
                product = products[0] ?? null;
            }
            if (!product) {
                trackPaywallError('Product not found');
                onClose(PaywallResult.ERROR);
                return;
            }
            const result = await RevenueCat.purchaseStoreProduct(product);
            storage.getState().applyPurchases(result.customerInfo);
            onClose(PaywallResult.PURCHASED);
        } catch (e: any) {
            if (e?.userCancelled) {
                onClose(PaywallResult.CANCELLED);
            } else {
                trackPaywallError(e?.message ?? 'Purchase failed');
                onClose(PaywallResult.ERROR);
            }
        } finally {
            setLoading(false);
        }
    }, [loading, selectedPlan, weeklyProduct, yearlyProduct, onClose]);

    const handleRestore = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            await RevenueCat.syncPurchases();
            const customerInfo = await RevenueCat.getCustomerInfo();
            storage.getState().applyPurchases(customerInfo);
            onClose(PaywallResult.RESTORED);
        } catch (e) {
            trackPaywallError(e instanceof Error ? e.message : 'Restore failed');
            onClose(PaywallResult.ERROR);
        } finally {
            setLoading(false);
        }
    }, [loading, onClose]);

    return (
        <View style={styles.container}>
            {/* Close button */}
            <View style={[styles.closeRow, { paddingTop: insets.top + 12 }]}>
                <Pressable onPress={() => onClose(PaywallResult.CANCELLED)} style={styles.closeBtn} hitSlop={12}>
                    <Text style={styles.closeBtnText}>✕</Text>
                </Pressable>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* App icon */}
                <Image
                    source={require('@/assets/images/icon.png')}
                    style={{ width: 72, height: 72, borderRadius: 16 }}
                    contentFit="cover"
                />

                {/* Headline */}
                <Text style={styles.headline}>{t('paywall.headline')}</Text>
                <Text style={styles.subtitle}>{t('paywall.subtitle')}</Text>

                {/* Testimonial */}
                <View style={styles.reviewCard}>
                    <Text style={styles.stars}>★★★★★</Text>
                    <Text style={styles.reviewText}>{t('paywall.reviewText')}</Text>
                    <Text style={styles.reviewAuthor}>{t('paywall.reviewAuthor')}</Text>
                </View>

                {/* Features */}
                <View style={styles.features}>
                    <FeatureRow title={t('paywall.feature1')} subtitle={t('paywall.feature1Sub')} />
                    <FeatureRow title={t('paywall.feature2')} subtitle={t('paywall.feature2Sub')} />
                    <FeatureRow title={t('paywall.feature3')} />
                </View>

                <Pressable
                    onPress={() => setSelectedPlan('weekly')}
                    style={[styles.planCard, styles.planCardWeekly, selectedPlan === 'weekly' && styles.planCardSelected]}
                >
                    <View style={styles.planCardHeader}>
                        <View>
                            <Text style={styles.priceCardLabel}>{t('paywall.weeklyLabel')} · {weeklyPrice}</Text>
                            <Text style={styles.priceCardPerWeek}>{weeklyPrice} / week</Text>
                        </View>
                        <View style={[styles.planCardRadio, selectedPlan === 'weekly' && styles.planCardRadioSelected]}>
                            {selectedPlan === 'weekly' ? <Text style={styles.planCardRadioText}>✓</Text> : null}
                        </View>
                    </View>
                </Pressable>

                <Pressable
                    onPress={() => setSelectedPlan('yearly')}
                    style={[styles.planCard, styles.priceCardMain, selectedPlan === 'yearly' && styles.planCardSelected]}
                >
                    <View style={styles.saveBadge}>
                        <Text style={styles.saveBadgeText}>Save {SAVE_PERCENT}</Text>
                    </View>
                    <View style={styles.planCardHeader}>
                        <View style={styles.planCardMainText}>
                            <Text style={styles.priceCardLabelMain}>{t('paywall.yearlyLabel')} · {yearlyPrice}</Text>
                            <Text style={styles.freeTrialNote}>{t('paywall.freeTrialNote')}</Text>
                        </View>
                        <View style={[styles.planCardRadio, styles.planCardRadioLight, selectedPlan === 'yearly' && styles.planCardRadioSelectedLight]}>
                            {selectedPlan === 'yearly' ? <Text style={styles.planCardRadioTextLight}>✓</Text> : null}
                        </View>
                    </View>
                    <Text style={styles.priceCardPerWeekMain}>{YEARLY_PER_WEEK} / week</Text>
                </Pressable>

                {selectedPlan === 'yearly' ? (
                    <View style={styles.noPaymentRow}>
                        <Text style={styles.noPaymentText}>✓ {t('paywall.noPaymentDue')}</Text>
                    </View>
                ) : null}

                {/* CTA */}
                <Pressable
                    style={[styles.ctaButton, loading && styles.ctaButtonLoading]}
                    onPress={handlePurchase}
                    disabled={loading || productsLoading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.ctaText}>{selectedPlan === 'yearly' ? t('paywall.cta') : t('common.continue')}</Text>
                    )}
                </Pressable>

                {/* Footer links */}
                <View style={styles.footer}>
                    <Pressable onPress={() => Linking.openURL('https://huppy.ai/terms/')}>
                        <Text style={styles.footerLink}>{t('paywall.terms')}</Text>
                    </Pressable>
                    <Text style={styles.footerDivider}>·</Text>
                    <Pressable onPress={handleRestore}>
                        <Text style={styles.footerLink}>{t('paywall.restore')}</Text>
                    </Pressable>
                    <Text style={styles.footerDivider}>·</Text>
                    <Pressable onPress={() => Linking.openURL('https://huppy.ai/privacy/')}>
                        <Text style={styles.footerLink}>{t('paywall.privacy')}</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

function FeatureRow({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <View style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{title}</Text>
                {subtitle ? <Text style={styles.featureSubtitle}>{subtitle}</Text> : null}
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create(() => ({
    container: {
        flex: 1,
        backgroundColor: '#0D0D12',
    },
    closeRow: {
        paddingHorizontal: 20,
        alignItems: 'flex-end',
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10,
    },
    closeBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        gap: 16,
    },
    headline: {
        fontSize: 26,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginTop: 8,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 22,
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        width: '100%',
        gap: 6,
    },
    stars: {
        color: '#F5A623',
        fontSize: 16,
        letterSpacing: 2,
    },
    reviewText: {
        fontSize: 14,
        color: '#1C1C1E',
        lineHeight: 20,
    },
    reviewAuthor: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    features: {
        width: '100%',
        gap: 12,
        marginTop: 4,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    featureCheck: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginTop: 1,
    },
    featureText: {
        flex: 1,
        gap: 2,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    featureSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
    },
    planCard: {
        width: '100%',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        gap: 10,
    },
    planCardWeekly: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(255,255,255,0.12)',
    },
    planCardSelected: {
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    planCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    planCardMainText: {
        flex: 1,
        gap: 2,
    },
    planCardRadio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    planCardRadioSelected: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    planCardRadioText: {
        color: '#0D0D12',
        fontSize: 12,
        fontWeight: '800',
        marginTop: -1,
    },
    planCardRadioLight: {
        borderColor: 'rgba(255,255,255,0.35)',
    },
    planCardRadioSelectedLight: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    planCardRadioTextLight: {
        color: '#0D0D12',
        fontSize: 12,
        fontWeight: '800',
        marginTop: -1,
    },
    priceCardLabel: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    priceCardPerWeek: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
    },
    priceCardMain: {
        backgroundColor: 'rgba(99,102,241,0.25)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: '#6366F1',
        position: 'relative',
    },
    saveBadge: {
        position: 'absolute',
        top: -12,
        right: 16,
        backgroundColor: '#6366F1',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    saveBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    priceCardMainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceCardLabelMain: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
    },
    freeTrialNote: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.55)',
        marginTop: 2,
    },
    priceCardPerWeekMain: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '700',
    },
    noPaymentRow: {
        marginTop: -4,
    },
    noPaymentText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
    },
    ctaButton: {
        width: '100%',
        backgroundColor: '#6366F1',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
    },
    ctaButtonLoading: {
        opacity: 0.7,
    },
    ctaText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    footerLink: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    footerDivider: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.2)',
    },
}));
