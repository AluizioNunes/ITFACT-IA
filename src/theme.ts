import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

// Paleta inspirada no TIDAL: preto profundo, textos claros e acento ciano
const tidalTheme: ThemeConfig = {
  algorithm: [antdTheme.darkAlgorithm],
  token: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontSize: 16,
    colorPrimary: '#00E5FF',
    colorPrimaryHover: '#33F0FF',
    colorPrimaryActive: '#00CCE6',
    colorBgBase: '#000000',
    colorBgContainer: '#0b0c0f',
    colorBorder: '#1a1c20',
    colorText: '#F2F2F2',
    colorTextSecondary: '#A6A6A6',
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
  },
};

export default tidalTheme;