import { beforeEach, describe, expect, it, vi } from 'vitest';

const { axiosGet, axiosPost } = vi.hoisted(() => ({
    axiosGet: vi.fn(),
    axiosPost: vi.fn(),
}));

vi.mock('axios', () => ({
    default: {
        get: axiosGet,
        post: axiosPost,
    },
}));

vi.mock('@/sync/serverConfig', () => ({
    getServerUrl: () => 'https://api.test.com',
}));

import { authApprove } from './authApprove';
import { encodeBase64 } from '@/encryption/base64';

describe('authApprove', () => {
    const token = 'test-token';
    const publicKey = new Uint8Array([1, 2, 3, 4]);
    const answerV1 = new Uint8Array([5, 6, 7, 8]);
    const answerV2 = new Uint8Array([9, 10, 11, 12]);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns not_found without posting a response when the auth request is missing', async () => {
        axiosGet.mockResolvedValue({
            data: {
                status: 'not_found',
                supportsV2: false,
            },
        });

        await expect(authApprove(token, publicKey, answerV1, answerV2)).resolves.toBe('not_found');

        expect(axiosGet).toHaveBeenCalledTimes(1);
        expect(axiosPost).not.toHaveBeenCalled();
    });

    it('returns already_authorized without posting again when the auth request is already complete', async () => {
        axiosGet.mockResolvedValue({
            data: {
                status: 'authorized',
                supportsV2: true,
            },
        });

        await expect(authApprove(token, publicKey, answerV1, answerV2)).resolves.toBe('already_authorized');

        expect(axiosGet).toHaveBeenCalledTimes(1);
        expect(axiosPost).not.toHaveBeenCalled();
    });

    it('posts the v2 response when the pending auth request supports v2', async () => {
        axiosGet.mockResolvedValue({
            data: {
                status: 'pending',
                supportsV2: true,
            },
        });
        axiosPost.mockResolvedValue({ data: { success: true } });

        await expect(authApprove(token, publicKey, answerV1, answerV2)).resolves.toBe('approved');

        expect(axiosPost).toHaveBeenCalledWith(
            'https://api.test.com/v1/auth/response',
            {
                publicKey: encodeBase64(publicKey),
                response: encodeBase64(answerV2),
            },
            {
                headers: {
                    Authorization: 'Bearer test-token',
                },
            }
        );
    });
});
