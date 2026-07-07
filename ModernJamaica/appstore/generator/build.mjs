import { readFileSync, writeFileSync } from 'node:fs';

// =============================================================================
// App Store スクリーンショット生成
// 実機シミュレータ(iPhone 17 Pro Max, 1320×2868)で撮影した「本物の」スクショを
// 端末フレーム＋見出しコピー＋ブランドの「式の木」モチーフで構成する。
// 画面は再現(HTML模写)ではなく、実際のアプリのスクリーンショットを埋め込む。
// =============================================================================

// ---- Brand tokens (from src/design/modernDesignSystem.ts) ----
const C = {
  bg1: '#1A1B23', bg2: '#242530', bg3: '#2D2E3F',
  neon: '#60A5FA', purple: '#C084FC', coral: '#FB923C', gold: '#FDE047', mint: '#6EE7B7',
  tPrimary: '#F9FAFB', tSecondary: '#E5E7EB', tTertiary: '#CBD5E1', tDisabled: '#6B7280',
};
const FONT = `-apple-system,"SF Pro Display","SF Pro Text",system-ui,sans-serif`;
// font shorthand w/ -apple-system fails to parse in headless Chrome -> use longhand always.
const T = (w, px, extra = '') => `font-weight:${w};font-size:${px}px;${extra}`;

// ---- canvas / device geometry (Apple 6.9" primary = 1290×2796) ----
const W = 1290, H = 2796;
const Dw = 1092, Dtop = 812, pad = 20;
const Dleft = Math.round((W - Dw) / 2);
const Sw = Dw - pad * 2;              // screen inner width = 1052
const Sh = 2340;                      // screen inner height (device protrudes past canvas bottom)

// ---- real screenshots (captured from the running app) ----
const SHOT_W = 1320, SHOT_H = 2868;   // iPhone 17 Pro Max native (a valid 6.9" size)
const SHOT_SCALE = Sw / SHOT_W;       // fit screenshot to the screen width
const shotURI = name =>
  `data:image/png;base64,${readFileSync(new URL(`./shots/${name}.png`, import.meta.url)).toString('base64')}`;

// 端末画面領域に実スクショを幅フィットで配置。showPx は「画面上部から何px分を見せるか」で、
// これより下（AdMob テストバナー等）はクリップして隠す。省略時は全高。
function screenShot(name, showPx = SHOT_H) {
  const clipH = Math.round(showPx * SHOT_SCALE);
  return `<div style="position:absolute;inset:0;background:${C.bg1}">
    <div style="width:${Sw}px;height:${clipH}px;overflow:hidden">
      <img src="${shotURI(name)}" style="width:${Sw}px;height:auto;display:block"/>
    </div>
  </div>`;
}

// ---------- slide assembly ----------
function orb(x, y, size, color, op) {
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:50%;
    background:radial-gradient(circle,${color} 0%,transparent 70%);filter:blur(${Math.round(size * 0.16)}px);opacity:${op}"></div>`;
}
function slide({ eyebrow, headline, accent, screenHTML }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${W}px;height:${H}px;overflow:hidden}
    body{font-family:${FONT};background:radial-gradient(130% 90% at 50% -8%, ${C.bg2} 0%, ${C.bg1} 52%, #131319 100%);position:relative}
  </style></head><body>
    ${orb(-180, -140, 760, C.neon, 0.15)}
    ${orb(W - 380, 300, 680, C.purple, 0.12)}
    ${orb(-240, H - 640, 720, C.coral, 0.10)}
    <svg width="${W}" height="${H}" style="position:absolute;inset:0;opacity:.05" viewBox="0 0 ${W} ${H}">
      <g stroke="${C.tPrimary}" stroke-width="3" fill="none">
        <line x1="985" y1="150" x2="1125" y2="330"/><line x1="1125" y1="330" x2="1045" y2="520"/><line x1="1125" y1="330" x2="1245" y2="500"/>
      </g><g fill="${C.tPrimary}"><circle cx="985" cy="150" r="26"/><circle cx="1125" cy="330" r="30"/><circle cx="1045" cy="520" r="22"/><circle cx="1245" cy="500" r="22"/></g>
    </svg>

    <div style="position:absolute;left:96px;right:96px;top:158px">
      <div style="display:flex;align-items:center;gap:20px;margin-bottom:30px">
        <span style="width:60px;height:6px;border-radius:3px;background:${accent}"></span>
        <span style="${T(700, 31, `color:${accent};letter-spacing:4px`)}">${eyebrow}</span>
      </div>
      <div style="${T(800, 92, `color:${C.tPrimary};line-height:1.26;letter-spacing:0`)}">${headline}</div>
    </div>

    <div style="position:absolute;left:${Dleft}px;top:${Dtop}px;width:${Dw}px;height:2380px;
      background:linear-gradient(155deg,#4a4b57 0%,#2b2c38 30%,#232430 100%);border-radius:112px;padding:${pad}px;
      box-shadow:0 70px 130px rgba(0,0,0,.6), 0 0 160px ${accent}22, inset 0 0 0 2px rgba(255,255,255,.04)">
      <div style="width:${Sw}px;height:${Sh}px;background:${C.bg1};border-radius:92px;overflow:hidden;position:relative">
        ${screenHTML}
      </div>
    </div>
  </body></html>`;
}

// 見出し・アイブロウは実装の文言に準拠。AdMob テストバナーがある画面(hero/ranking)は showPx でクリップ。
const slides = [
  { name: '01-hero', eyebrow: 'MODERN JAMAICA', accent: C.neon,
    headline: '数字をつなげて、<br>目標の数をつくる。', screenHTML: screenShot('01-hero', 2520) },
  { name: '02-core', eyebrow: 'コアパズル', accent: C.purple,
    headline: '5つの数字を<br>組み合わせて解く。', screenHTML: screenShot('02-core') },
  { name: '03-solved', eyebrow: '正解！', accent: C.mint,
    headline: '解けた瞬間の、<br>この気持ちよさ。', screenHTML: screenShot('03-solved') },
  { name: '04-challenge', eyebrow: 'チャレンジモード', accent: C.coral,
    headline: '時間との勝負。<br>何問解ける？', screenHTML: screenShot('04-challenge') },
  { name: '05-difficulty', eyebrow: 'かんたん / ふつう / むずかしい', accent: C.gold,
    headline: 'こどもから大人まで、<br>3つの難易度。', screenHTML: screenShot('05-difficulty') },
  { name: '06-ranking', eyebrow: 'ランキング', accent: C.neon,
    headline: '全国のプレイヤーと、<br>スコアで競う。', screenHTML: screenShot('06-ranking', 2530) },
];

for (const sl of slides) {
  writeFileSync(new URL(`./out/${sl.name}.html`, import.meta.url), slide(sl));
}
console.log('done', slides.length, 'slides', 'W', W, 'H', H, 'scale', SHOT_SCALE.toFixed(4));
