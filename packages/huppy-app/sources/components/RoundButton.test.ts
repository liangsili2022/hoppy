import * as React from 'react';
import TestRenderer from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-native', async () => {
    const ReactModule = await import('react');
    const React = ReactModule.default ?? ReactModule;
    const createMockComponent = (name: string) => {
        const Component = (props: Record<string, unknown>) => React.createElement(name, props, props.children as React.ReactNode);
        Component.displayName = name;
        return Component;
    };
    const Pressable = createMockComponent('Pressable');
    const View = createMockComponent('View');
    const Text = createMockComponent('Text');
    const ActivityIndicator = createMockComponent('ActivityIndicator');

    return {
        ActivityIndicator,
        Pressable,
        Text,
        View,
        Platform: {
            OS: 'web',
        },
    };
});

vi.mock('react-native-typography', () => ({
    iOSUIKit: {
        title3: {},
    },
}));

vi.mock('@/constants/Typography', () => ({
    Typography: {
        default: () => ({}),
    },
}));

vi.mock('react-native-unistyles', () => ({
    StyleSheet: {
        create: (factory: unknown) => {
            if (typeof factory === 'function') {
                return factory({
                    colors: {
                        textSecondary: '#8A8A8A',
                    },
                });
            }

            return factory;
        },
    },
    useUnistyles: () => ({
        theme: {
            colors: {
                textSecondary: '#8A8A8A',
            },
        },
    }),
}));

import { Pressable } from 'react-native';
import { RoundButton } from './RoundButton';

type InteractionState = {
    focused: boolean;
    hovered: boolean;
    pressed: boolean;
};

function flattenStyle(value: unknown): Record<string, unknown> {
    if (Array.isArray(value)) {
        return value.reduce<Record<string, unknown>>((acc, item) => {
            Object.assign(acc, flattenStyle(item));
            return acc;
        }, {});
    }

    if (value && typeof value === 'object') {
        return { ...(value as Record<string, unknown>) };
    }

    return {};
}

function resolveContainerStyle(styleProp: unknown, state: InteractionState): Record<string, unknown> {
    const evaluated = typeof styleProp === 'function'
        ? styleProp(state)
        : styleProp;

    return flattenStyle(evaluated);
}

describe('RoundButton', () => {
    it('suppresses the browser default outline and uses a custom focus ring on web primary buttons', () => {
        let renderer: any;
        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(RoundButton, { title: 'Login with mobile app' })
            );
        });

        const pressable = renderer.root.findByType(Pressable);

        const idleStyle = resolveContainerStyle(pressable.props.style, {
            focused: false,
            hovered: false,
            pressed: false,
        });

        expect(idleStyle.outlineStyle).toBe('none');
        expect(idleStyle.outlineWidth).toBe(0);

        const focusedStyle = resolveContainerStyle(pressable.props.style, {
            focused: true,
            hovered: false,
            pressed: false,
        });

        expect(focusedStyle.boxShadow).toContain('0 0 0 3px');
    });

    it('uses the same controlled focus treatment for inverted buttons on web', () => {
        let renderer: any;
        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(RoundButton, { title: 'Create account', display: 'inverted' })
            );
        });

        const pressable = renderer.root.findByType(Pressable);

        const focusedStyle = resolveContainerStyle(pressable.props.style, {
            focused: true,
            hovered: false,
            pressed: false,
        });

        expect(focusedStyle.outlineStyle).toBe('none');
        expect(focusedStyle.outlineWidth).toBe(0);
        expect(focusedStyle.boxShadow).toContain('0 0 0 3px');
    });
});
