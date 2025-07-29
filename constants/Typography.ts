// kodlar/constants/Typography.ts
import { Layout } from './Layout';

const scale = Layout.isTablet ? 1.5 : 1;

export const Typography = {
  h1: {
    fontSize: Layout.fontSize(30 * scale),
    fontWeight: '700' as const,
    fontFamily: 'Inter-Bold',
  },
  h2: {
    fontSize: Layout.fontSize(24 * scale),
    fontWeight: '700' as const,
    fontFamily: 'Inter-Bold',
  },
  h3: {
    fontSize: Layout.fontSize(20 * scale),
    fontWeight: '600' as const,
    fontFamily: 'Inter-SemiBold',
  },
  body: {
    fontSize: Layout.fontSize(16 * scale),
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
  },
  bodyMedium: {
    fontSize: Layout.fontSize(16 * scale),
    fontWeight: '500' as const,
    fontFamily: 'Inter-Medium',
  },
  caption: {
    fontSize: Layout.fontSize(12 * scale),
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
  },
  captionMedium: {
    fontSize: Layout.fontSize(12 * scale),
    fontWeight: '500' as const,
    fontFamily: 'Inter-Medium',
  },
};