import { describe, it, expect } from 'vitest';
import { getTransformedImageUrl } from '../../utils/cloudinary';

describe('getTransformedImageUrl', () => {
    it('returns original url if empty or not a string', () => {
        expect(getTransformedImageUrl(null)).toBe(null);
        expect(getTransformedImageUrl(undefined)).toBe(undefined);
        expect(getTransformedImageUrl(123)).toBe(123);
    });

    it('returns original url if not a cloudinary url', () => {
        const url = 'https://example.com/image.jpg';
        expect(getTransformedImageUrl(url)).toBe(url);
    });

    it('returns original url if /upload/ is missing', () => {
        const url = 'https://res.cloudinary.com/demo/image/fetch/https://example.com/image.jpg';
        expect(getTransformedImageUrl(url)).toBe(url);
    });

    it('transforms url with options', () => {
        const url = 'https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg';
        const options = { width: 100, height: 200, crop: 'fill' };
        const result = getTransformedImageUrl(url, options);
        expect(result).toBe('https://res.cloudinary.com/demo/image/upload/w_100,h_200,c_fill,f_auto,q_auto/v12345/sample.jpg');
    });

    it('uses default scale crop if not provided', () => {
        const url = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
        const result = getTransformedImageUrl(url, { width: 100 });
        expect(result).toContain('c_scale');
    });

    it('handles falsy crop option', () => {
        const url = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
        const result = getTransformedImageUrl(url, { crop: false });
        expect(result).not.toContain('c_');
        expect(result).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/sample.jpg');
    });
});
