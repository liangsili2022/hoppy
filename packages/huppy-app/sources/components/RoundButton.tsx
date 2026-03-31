import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { iOSUIKit } from 'react-native-typography';
import { Typography } from '@/constants/Typography';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export type RoundButtonSize = 'large' | 'normal' | 'small';
const sizes: { [key in RoundButtonSize]: { height: number, fontSize: number, hitSlop: number, pad: number } } = {
    large: { height: 48, fontSize: 21, hitSlop: 0, pad: Platform.OS == 'ios' ? 0 : -1 },
    normal: { height: 32, fontSize: 16, hitSlop: 8, pad: Platform.OS == 'ios' ? 1 : -2 },
    small: { height: 24, fontSize: 14, hitSlop: 12, pad: Platform.OS == 'ios' ? -1 : -1 }
}

export type RoundButtonDisplay = 'default' | 'inverted';

const WEB_PRIMARY_GLOW = '0 0 20px rgba(255,154,60,0.25), inset 0 0 20px rgba(255,154,60,0.05)';
const WEB_FOCUS_RING = '0 0 0 3px rgba(255,154,60,0.32)';

const stylesheet = StyleSheet.create((theme) => ({
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 64,
        paddingHorizontal: 16,
        borderRadius: 9999,
    },
    text: {
        ...Typography.default('semiBold'),
        fontWeight: '600',
        includeFontPadding: false,
    },
}));

export const RoundButton = React.memo((props: { size?: RoundButtonSize, display?: RoundButtonDisplay, title?: any, style?: StyleProp<ViewStyle>, textStyle?: StyleProp<TextStyle>, disabled?: boolean, loading?: boolean, onPress?: () => void, action?: () => Promise<any> }) => {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const [loading, setLoading] = React.useState(false);
    const doLoading = props.loading !== undefined ? props.loading : loading;
    const doAction = React.useCallback(() => {
        if (props.onPress) {
            props.onPress();
            return;
        }
        if (props.action) {
            setLoading(true);
            (async () => {
                try {
                    await props.action!();
                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [props.onPress, props.action]);
    const displays: { [key in RoundButtonDisplay]: {
        textColor: string,
        backgroundColor: string,
        borderColor: string,
    } } = {
        default: {
            // Huppy: neon orange outline style (Option C)
            backgroundColor: 'transparent',
            borderColor: '#FF9A3C',
            textColor: '#FF9A3C',
        },
        inverted: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            textColor: theme.colors.textSecondary,
        }
    }

    const size = sizes[props.size || 'large'];
    const display = displays[props.display || 'default'];

    return (
        <Pressable
            disabled={doLoading || props.disabled}
            hitSlop={size.hitSlop}
            style={(p) => {
                const isFocused = 'focused' in p && Boolean((p as typeof p & { focused?: boolean }).focused);

                return ([
                    {
                        borderWidth: 1.5,
                        borderRadius: size.height / 2,
                        backgroundColor: display.backgroundColor,
                        borderColor: display.borderColor,
                        opacity: props.disabled ? 0.5 : 1,
                        overflow: 'hidden',
                        // react-native-web Pressable becomes focusable via tabIndex, so we replace
                        // the browser default outline with a project-controlled glow/ring.
                        ...(Platform.OS === 'web' ? {
                            outlineStyle: 'none',
                            outlineWidth: 0,
                            outlineColor: 'transparent',
                            boxShadow: [
                                isFocused ? WEB_FOCUS_RING : null,
                                display.borderColor === '#FF9A3C' ? WEB_PRIMARY_GLOW : null,
                            ].filter(Boolean).join(', ') || 'none',
                        } as any : {}),
                    },
                    {
                        opacity: p.pressed ? 0.9 : 1
                    },
                    props.style
                ]);
            }}
            onPress={doAction}
        >
            <View 
                style={[
                    styles.contentContainer,
                    { height: size.height - 2 }
                ]}
            >
                {doLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={display.textColor} size='small' />
                    </View>
                )}
                <Text 
                    style={[
                        iOSUIKit.title3, 
                        styles.text,
                        { 
                            marginTop: size.pad, 
                            opacity: doLoading ? 0 : 1, 
                            color: display.textColor, 
                            fontSize: size.fontSize, 
                        }, 
                        props.textStyle
                    ]} 
                    numberOfLines={1}
                >
                    {props.title}
                </Text>
            </View>
        </Pressable>
    )
});
