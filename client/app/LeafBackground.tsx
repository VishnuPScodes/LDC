/** Decorative botanical line art. Kept inline so it stays crisp at every size. */
export default function LeafBackground() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="leaf-bg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1000 2800"
      preserveAspectRatio="xMidYMin slice"
    >
      <defs>
        <g id="leaf">
          <path className="leaf-fill" d="M0 0C17-47 67-72 104-46c32 22 23 69-9 99C62 86 17 63 0 0Z" />
          <path className="leaf-vein" d="M2 2C35 12 63 31 94 54M25 12 31-10M45 22l8-27M64 36l11-22M29 16l-5 23M51 27l-1 27M71 41l3 20" />
        </g>
        <g id="sprig" className="leaf-sprig">
          <path className="leaf-stem" d="M0 0C10-40-8-76 7-116s-2-72 20-105" />
          <use href="#leaf" transform="translate(2 -29) rotate(-142) scale(.64)" />
          <use href="#leaf" transform="translate(3 -61) rotate(18) scale(.76)" />
          <use href="#leaf" transform="translate(1 -97) rotate(-145) scale(.55)" />
          <use href="#leaf" transform="translate(12 -128) rotate(19) scale(.68)" />
          <use href="#leaf" transform="translate(20 -164) rotate(-139) scale(.48)" />
        </g>
      </defs>
      <g className="leaf-art">
        <use href="#sprig" transform="translate(42 216) rotate(-18) scale(1.25)" />
        <use href="#sprig" transform="translate(970 116) rotate(158) scale(1.28)" />
        <use href="#sprig" transform="translate(4 840) rotate(-8) scale(1.05)" />
        <use href="#sprig" transform="translate(1000 745) rotate(166) scale(1.18)" />
        <use href="#sprig" transform="translate(64 1510) rotate(-21) scale(1.32)" />
        <use href="#sprig" transform="translate(965 1430) rotate(157) scale(1.3)" />
        <use href="#sprig" transform="translate(12 2180) rotate(-9) scale(1.15)" />
        <use href="#sprig" transform="translate(1000 2060) rotate(165) scale(1.26)" />
        <use href="#sprig" transform="translate(282 470) rotate(18) scale(.68)" />
        <use href="#sprig" transform="translate(760 1060) rotate(166) scale(.7)" />
        <use href="#sprig" transform="translate(335 1770) rotate(-12) scale(.72)" />
        <use href="#sprig" transform="translate(825 2500) rotate(170) scale(.82)" />
        <use href="#leaf" transform="translate(170 1050) rotate(62) scale(.7)" />
        <use href="#leaf" transform="translate(800 390) rotate(-125) scale(.82)" />
        <use href="#leaf" transform="translate(730 1880) rotate(55) scale(.62)" />
        <use href="#leaf" transform="translate(205 2390) rotate(-135) scale(.78)" />
        <use href="#leaf" transform="translate(555 730) rotate(28) scale(.54)" />
        <use href="#leaf" transform="translate(490 2260) rotate(-145) scale(.62)" />
      </g>
      <style>{`
        .leaf-art { color: #286b45; }
        .leaf-sprig { opacity: .26; }
        .leaf-stem, .leaf-vein { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
        .leaf-stem { stroke-width: 1.8; opacity: .58; }
        .leaf-fill { fill: currentColor; fill-opacity: .075; stroke: currentColor; stroke-width: 1.35; stroke-opacity: .56; stroke-linejoin: round; }
        .leaf-vein { stroke-width: 1; stroke-opacity: .4; }
      `}</style>
    </svg>
  );
}
