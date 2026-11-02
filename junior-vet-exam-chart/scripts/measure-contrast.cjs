function sRGBtoLin(colorChannel) {
  return colorChannel <= 0.03928 ? colorChannel / 12.92 : Math.pow((colorChannel + 0.055) / 1.055, 2.4);
}

function getLuminance(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}

function getContrast(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const themes = {
  default: {
    name: 'スカイブルー',
    bg: '#FFFFFF',
    text: '#1E293B',
    textSubtleNew: '#475569',
    textSubtleOld: '#64748B',
    goldBg: '#FEF3C7',
    goldText: '#78350F',
    goldTitle: '#92400E',
    successWeak: '#ECFDF5',
    successText: '#065F46',
    primary: '#2563EB',
    btnText: '#FFFFFF',
  },
  sakura: {
    name: 'サクラ',
    bg: '#FFFFFF',
    text: '#1E293B',
    textSubtleNew: '#475569',
    textSubtleOld: '#64748B',
    goldBg: '#FEF3C7',
    goldText: '#78350F',
    goldTitle: '#92400E',
    successWeak: '#ECFDF5',
    successText: '#065F46',
    primary: '#DB2777',
    btnText: '#FFFFFF',
  },
  mint: {
    name: 'ミント',
    bg: '#FFFFFF',
    text: '#1E293B',
    textSubtleNew: '#475569',
    textSubtleOld: '#64748B',
    goldBg: '#FEF3C7',
    goldText: '#78350F',
    goldTitle: '#92400E',
    successWeak: '#ECFDF5',
    successText: '#065F46',
    primary: '#059669',
    btnText: '#FFFFFF',
  },
  lavender: {
    name: 'ラベンダー',
    bg: '#FFFFFF',
    text: '#1E293B',
    textSubtleNew: '#475569',
    textSubtleOld: '#64748B',
    goldBg: '#FEF3C7',
    goldText: '#78350F',
    goldTitle: '#92400E',
    successWeak: '#ECFDF5',
    successText: '#065F46',
    primary: '#7C3AED',
    btnText: '#FFFFFF',
  },
  night: {
    name: '夜空自習室',
    bg: '#17223B',
    text: '#FFFFFF',
    textSubtleNew: '#E2E8F0',
    textSubtleOld: '#94A3B8',
    goldBg: '#241808',
    goldText: '#FEF3C7',
    goldTitle: '#FDE68A',
    successWeak: '#064E3B',
    successText: '#6EE7B7',
    primary: '#38BDF8',
    btnText: '#0B1120',
  },
};

console.log('=== WCAG 2.1 Contrast Ratio Measurement Table ===');
console.log('| テーマ | 本文 (--text) | 補足 (新 #475569) | 補足 (旧 #64748B) | 琥珀本文 (--accent-gold-text) | 琥珀見出し (--accent-gold-title) | 緑本文 (--success-text) | ボタン文字 (白/黒 on Primary) |');
console.log('|---|---|---|---|---|---|---|---|');

for (const [key, t] of Object.entries(themes)) {
  const textContrast = getContrast(t.text, t.bg).toFixed(2);
  const subtleNewContrast = getContrast(t.textSubtleNew, t.bg).toFixed(2);
  const subtleOldContrast = getContrast(t.textSubtleOld, t.bg).toFixed(2);
  const goldTextContrast = getContrast(t.goldText, t.goldBg).toFixed(2);
  const goldTitleContrast = getContrast(t.goldTitle, t.goldBg).toFixed(2);
  const successContrast = getContrast(t.successText, t.successWeak).toFixed(2);
  const btnContrast = getContrast(t.btnText, t.primary).toFixed(2);

  console.log(`| **${t.name}** | ${textContrast}:1 | ${subtleNewContrast}:1 | ${subtleOldContrast}:1 | ${goldTextContrast}:1 | ${goldTitleContrast}:1 | ${successContrast}:1 | ${btnContrast}:1 |`);
}

console.log('\n=== Candidate Subtle Colors on White (#FFFFFF) ===');
const candidates = ['#64748B', '#596A82', '#52637A', '#4F5E74', '#4B5563', '#475569'];
for (const c of candidates) {
  console.log(`${c}: ${getContrast(c, '#FFFFFF').toFixed(2)}:1`);
}
