/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/*.{vue,js,jsx,ts,tsx}'],
  plugins: [require('daisyui')],
  themes: ["light", "dark", "cupcake"],
  theme:{
    fontFamily: {
    body: [
      'Arial',
      'Hiragino Sans',
      'ヒラギノ角ゴシック',
      'メイリオ',
      'Meiryo',
      'ＭＳ Ｐゴシック',
      'MS PGothic',
      'Noto Sans CJK JP',
      'Noto Color Emoji',
      'sans-serif'
    ]
  }
  }
};
