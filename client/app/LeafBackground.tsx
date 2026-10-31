/**
 * LeafBackground – decorative, aria-hidden SVG leaves drawn as green outlines
 * scattered across the page. Rendered as a fixed, pointer-events-none overlay
 * so it sits behind all content on both landing pages.
 *
 * Inspired by the artwork style in the Seekers Journey app: simple contour
 * drawings with no fill, just a gentle green stroke at low opacity.
 */
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
      {/* Shared stroke style — a calm forest green at ~11 % opacity */}
      <g
        fill="none"
        stroke="#2d7a4f"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* ── Cluster 1 – upper left ── */}
        <g transform="translate(60,90) rotate(-18)">
          {/* Large leaf */}
          <path strokeWidth="1.4" opacity=".13"
            d="M0,0 C10,-55 60,-80 90,-50 C120,-20 100,40 60,60 C20,80 -10,55 0,0 Z" />
          {/* Mid-rib */}
          <line strokeWidth="1" opacity=".1" x1="0" y1="0" x2="60" y2="40" />
          {/* Veins */}
          <path strokeWidth=".7" opacity=".08"
            d="M15,10 Q35,0 55,15 M25,25 Q42,18 58,28 M35,38 Q48,35 58,42" />
        </g>

        {/* Small leaf beside cluster 1 */}
        <g transform="translate(130,50) rotate(25)">
          <path strokeWidth="1.1" opacity=".11"
            d="M0,0 C5,-28 28,-38 44,-22 C60,-6 48,22 28,30 C8,38 -5,28 0,0 Z" />
          <line strokeWidth=".8" opacity=".08" x1="0" y1="0" x2="28" y2="18" />
        </g>

        {/* ── Cluster 2 – upper right, large leaf ── */}
        <g transform="translate(870,60) rotate(12)">
          <path strokeWidth="1.6" opacity=".12"
            d="M0,0 C-12,-70 -80,-95 -110,-58 C-140,-21 -115,52 -68,70 C-21,88 12,70 0,0 Z" />
          <line strokeWidth="1" opacity=".09" x1="0" y1="0" x2="-68" y2="48" />
          <path strokeWidth=".7" opacity=".07"
            d="M-18,10 Q-42,2 -62,18 M-30,28 Q-50,22 -66,34 M-42,44 Q-56,42 -66,50" />
        </g>

        {/* Thin curling stem at upper right */}
        <g transform="translate(940,130) rotate(-8)">
          <path strokeWidth="1" opacity=".09"
            d="M0,0 C8,20 -4,45 0,70 C4,95 20,110 14,140" />
          {/* Two tiny leaves on the stem */}
          <path strokeWidth="1" opacity=".1"
            d="M0,30 C-8,22 -22,24 -18,36 C-14,48 0,44 0,30 Z" />
          <path strokeWidth="1" opacity=".1"
            d="M5,75 C14,67 28,70 24,82 C20,94 5,90 5,75 Z" />
        </g>

        {/* ── Cluster 3 – mid-left ── */}
        <g transform="translate(-20,600) rotate(30)">
          <path strokeWidth="1.8" opacity=".11"
            d="M0,0 C14,-75 85,-110 118,-68 C151,-26 128,55 75,78 C22,101 -14,75 0,0 Z" />
          <line strokeWidth="1.1" opacity=".08" x1="0" y1="0" x2="75" y2="52" />
          <path strokeWidth=".8" opacity=".07"
            d="M18,12 Q44,2 68,20 M30,32 Q52,24 72,38 M44,50 Q60,48 72,56" />
        </g>

        {/* Wisp leaf mid-left, lower */}
        <g transform="translate(40,720) rotate(-10)">
          <path strokeWidth="1" opacity=".1"
            d="M0,0 C6,-32 32,-44 50,-26 C68,-8 56,26 32,34 C8,42 -6,32 0,0 Z" />
          <line strokeWidth=".7" opacity=".08" x1="0" y1="0" x2="32" y2="22" />
        </g>

        {/* ── Cluster 4 – mid-right ── */}
        <g transform="translate(1010,680) rotate(-22)">
          <path strokeWidth="1.5" opacity=".12"
            d="M0,0 C-10,-60 -72,-88 -100,-54 C-128,-20 -108,46 -64,64 C-20,82 10,60 0,0 Z" />
          <line strokeWidth="1" opacity=".09" x1="0" y1="0" x2="-64" y2="44" />
          <path strokeWidth=".7" opacity=".07"
            d="M-14,10 Q-36,2 -56,16 M-26,28 Q-46,22 -60,32 M-38,42 Q-52,40 -60,48" />
        </g>

        {/* Tiny accent leaf mid-right */}
        <g transform="translate(960,780) rotate(15)">
          <path strokeWidth=".9" opacity=".09"
            d="M0,0 C4,-22 22,-30 34,-18 C46,-6 38,18 22,24 C6,30 -4,22 0,0 Z" />
        </g>

        {/* ── Cluster 5 – centre ── */}
        <g transform="translate(480,1100) rotate(-5)">
          {/* Rounded leaf */}
          <path strokeWidth="1.4" opacity=".1"
            d="M0,0 C8,-50 55,-72 80,-44 C105,-16 88,36 52,52 C16,68 -8,50 0,0 Z" />
          <line strokeWidth=".9" opacity=".08" x1="0" y1="0" x2="52" y2="36" />
          <path strokeWidth=".6" opacity=".07"
            d="M12,10 Q32,2 50,16 M22,24 Q38,18 50,28 M32,36 Q44,34 50,40" />
          {/* Smaller leaf at side */}
          <path strokeWidth="1" opacity=".09" transform="translate(90,10) rotate(40)"
            d="M0,0 C4,-24 24,-34 36,-20 C48,-6 40,18 24,24 C8,30 -4,22 0,0 Z" />
        </g>

        {/* Falling leaf – centre-right ── */}
        <g transform="translate(700,1280) rotate(55)">
          <path strokeWidth="1.2" opacity=".09"
            d="M0,0 C6,-36 38,-52 56,-32 C74,-12 62,26 38,34 C14,42 -6,32 0,0 Z" />
          <line strokeWidth=".8" opacity=".07" x1="0" y1="0" x2="38" y2="26" />
        </g>

        {/* ── Cluster 6 – lower-left ── */}
        <g transform="translate(0,1560) rotate(20)">
          <path strokeWidth="1.7" opacity=".12"
            d="M0,0 C12,-68 78,-100 108,-62 C138,-24 118,52 70,72 C22,92 -12,68 0,0 Z" />
          <line strokeWidth="1" opacity=".09" x1="0" y1="0" x2="70" y2="50" />
          <path strokeWidth=".7" opacity=".07"
            d="M16,12 Q40,2 62,18 M28,30 Q48,22 66,36 M40,46 Q56,44 66,52" />
        </g>

        {/* Delicate trailing leaf – lower left ── */}
        <g transform="translate(100,1670) rotate(-28)">
          <path strokeWidth="1" opacity=".09"
            d="M0,0 C5,-28 28,-38 44,-22 C60,-6 50,20 30,28 C10,36 -5,26 0,0 Z" />
          <line strokeWidth=".7" opacity=".07" x1="0" y1="0" x2="30" y2="20" />
        </g>

        {/* ── Cluster 7 – lower-right ── */}
        <g transform="translate(1020,1600) rotate(-15)">
          <path strokeWidth="1.6" opacity=".12"
            d="M0,0 C-10,-62 -76,-92 -106,-56 C-136,-20 -114,50 -68,68 C-22,86 12,64 0,0 Z" />
          <line strokeWidth="1" opacity=".09" x1="0" y1="0" x2="-68" y2="48" />
          <path strokeWidth=".7" opacity=".07"
            d="M-16,10 Q-40,2 -60,18 M-28,28 Q-48,22 -64,34 M-40,44 Q-54,42 -64,50" />
        </g>

        {/* ── Cluster 8 – bottom centre ── */}
        <g transform="translate(460,2150) rotate(8)">
          <path strokeWidth="1.5" opacity=".11"
            d="M0,0 C8,-54 60,-78 86,-48 C112,-18 96,42 56,60 C16,78 -10,58 0,0 Z" />
          <line strokeWidth="1" opacity=".08" x1="0" y1="0" x2="56" y2="40" />
          <path strokeWidth=".7" opacity=".07"
            d="M14,10 Q36,2 54,16 M24,26 Q42,20 54,30 M36,40 Q48,38 54,44" />
        </g>

        {/* Accent leaf – bottom-left ── */}
        <g transform="translate(80,2300) rotate(-12)">
          <path strokeWidth="1.2" opacity=".1"
            d="M0,0 C6,-38 40,-54 58,-34 C76,-14 64,28 40,36 C16,44 -6,34 0,0 Z" />
          <line strokeWidth=".8" opacity=".07" x1="0" y1="0" x2="40" y2="28" />
        </g>

        {/* Accent leaf – bottom-right ── */}
        <g transform="translate(920,2380) rotate(22)">
          <path strokeWidth="1.1" opacity=".1"
            d="M0,0 C5,-30 32,-42 48,-26 C64,-10 54,22 34,30 C14,38 -5,28 0,0 Z" />
          <line strokeWidth=".7" opacity=".07" x1="0" y1="0" x2="34" y2="24" />
        </g>

        {/* ── Scattered tiny sprigs throughout ── */}
        <g transform="translate(310,420) rotate(-35)" opacity=".09">
          <path strokeWidth="1"
            d="M0,0 C0,-15 10,-25 18,-18 C26,-11 22,8 12,12 C2,16 0,8 0,0 Z" />
        </g>
        <g transform="translate(680,510) rotate(48)" opacity=".08">
          <path strokeWidth=".9"
            d="M0,0 C0,-14 9,-22 16,-16 C23,-10 20,7 11,11 C2,14 0,7 0,0 Z" />
        </g>
        <g transform="translate(220,970) rotate(-20)" opacity=".09">
          <path strokeWidth="1"
            d="M0,0 C3,-20 18,-28 26,-18 C34,-8 28,12 16,16 C4,20 -2,12 0,0 Z" />
          <line strokeWidth=".7" x1="0" y1="0" x2="16" y2="11" />
        </g>
        <g transform="translate(790,1030) rotate(30)" opacity=".08">
          <path strokeWidth=".9"
            d="M0,0 C4,-22 20,-30 30,-20 C40,-10 32,14 18,18 C4,22 -4,14 0,0 Z" />
        </g>
        <g transform="translate(550,1680) rotate(-42)" opacity=".09">
          <path strokeWidth="1"
            d="M0,0 C4,-22 20,-30 30,-20 C40,-10 32,14 18,18 C4,22 -4,14 0,0 Z" />
          <line strokeWidth=".7" x1="0" y1="0" x2="18" y2="13" />
        </g>
        <g transform="translate(160,1920) rotate(18)" opacity=".08">
          <path strokeWidth=".9"
            d="M0,0 C3,-18 16,-25 24,-16 C32,-7 26,10 14,14 C2,18 -2,10 0,0 Z" />
        </g>
        <g transform="translate(840,1880) rotate(-30)" opacity=".09">
          <path strokeWidth="1"
            d="M0,0 C4,-24 22,-32 32,-22 C42,-12 34,16 20,20 C6,24 -4,16 0,0 Z" />
          <line strokeWidth=".7" x1="0" y1="0" x2="20" y2="14" />
        </g>
        <g transform="translate(390,2480) rotate(10)" opacity=".08">
          <path strokeWidth=".9"
            d="M0,0 C4,-20 18,-28 28,-18 C38,-8 30,12 18,16 C6,20 -4,12 0,0 Z" />
        </g>
        <g transform="translate(650,2560) rotate(-22)" opacity=".09">
          <path strokeWidth="1"
            d="M0,0 C5,-26 24,-34 36,-22 C48,-10 40,16 24,22 C8,28 -4,20 0,0 Z" />
          <line strokeWidth=".7" x1="0" y1="0" x2="24" y2="16" />
        </g>

        {/* ── Curving stem with leaf at mid-page ── */}
        <g transform="translate(500,900)" opacity=".08">
          <path strokeWidth="1"
            d="M-10,0 C-2,-30 10,-55 0,-80 C-10,-105 -22,-115 -10,-140" />
        </g>
      </g>
    </svg>
  );
}
