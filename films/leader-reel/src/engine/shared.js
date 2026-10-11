// Layout shared by neighbouring worlds so their hand-off frames match exactly.
(function () {
  const { U } = window;
  const GG = window.GL_GLYPH;
  // Both the flat 5 (glass → geometry) and the constructed 4 sit at the same placement as every numeral.
  const NUM_H = 760, NUM_CX = 960, NUM_CY = 540;
  const place = (ch) => GG.placeByHeight(ch, NUM_CX, NUM_CY, NUM_H);

  // Stripe rows inside the 4's counter: tiny lines of type that the camera zooms into (geometry → type).
  // All coordinates in SCREEN px at zoom 1; the zoom happens about `focus`.
  const p4 = place("4");
  const toScr = (x, y) => [x * p4.s + p4.ox, y * p4.s + p4.oy];
  const counterPoly = [[206, -292], [444, -292], [444, -430], [571, -634], [503, -700]].map(([x, y]) => toScr(x, y));
  const focus = toScr(362, -346);   // centre of the largest 16:9 box inside the counter
  const ZOOM_END = 15.0;
  const ROW_PX = 14.0;          // row pitch at zoom 1
  const FONT_PX = 10.6;         // Archivo 600 / wdth 100 at zoom 1
  const WORDS = ["TIMING", "SPACING", "WEIGHT", "RHYTHM", "LIGHT", "DEPTH", "FORM", "MOTION", "TENSION", "RELEASE"];
  function rowText(k) {
    let s = "";
    for (let i = 0; i < 14; i++) s += WORDS[(k * 3 + i) % WORDS.length] + "  ·  ";
    return s;
  }
  // rows cover the counter generously; row k sits at y = focus.y + (k - K0) * ROW_PX
  const ROWS = 48, K0 = 24;
  const rowY = (k) => focus[1] + (k - K0) * ROW_PX;
  // horizontal scroll (px at zoom 1), continuous across the hand-off; alternate directions
  const rowX = (k, t) => focus[0] - 460 + ((k % 2 ? -1 : 1) * 9 * (t - 7.9)) - (k * 37) % 120;

  window.SHARED = { NUM_H, NUM_CX, NUM_CY, place, counterPoly, focus, ZOOM_END, ROW_PX, FONT_PX, rowText, ROWS, K0, rowY, rowX, WORDS };
})();
