// kodlar/constants/Layout.ts
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const widthBaseScale = SCREEN_WIDTH / 414;
const heightBaseScale = SCREEN_HEIGHT / 896;

function normalize(size: number, based = 'width') {
  const newSize = (based === 'height') ?
    size * heightBaseScale : size * widthBaseScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

// For fonts
const responsiveScreenFontSize = (size: number) => {
  return normalize(size, 'height');
};

// For width
const responsiveScreenWidth = (size: number) => {
  return normalize(size, 'width');
};

const isTablet = SCREEN_WIDTH >= 768;

export const Layout = {
  screen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  isTablet,
  fontSize: responsiveScreenFontSize,
  width: responsiveScreenWidth,
};