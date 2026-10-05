// Images the film draws. Filled once at start-up by main.js.
export const ASSETS = { logo: null, logoMeta: null };

export async function loadImage(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}
