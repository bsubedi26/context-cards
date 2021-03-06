import bracketedDevicePixelRatio from "./bracketedDevicePixelRatio";

/**
 * @module thumbnail
 */

const SIZES = {
  portraitImage: {
    h: 250, // Exact height
    w: 203 // Max width
  },
  landscapeImage: {
    h: 200, // Max height
    w: 320 // Exact Width
  }
};

export { SIZES };

/**
 * @typedef {Object} ext.popups.Thumbnail
 * @property {Element} el
 * @property {Boolean} isTall Whether or not the thumbnail is portrait
 */

/**
 * Creates a thumbnail from the representation of a thumbnail returned by the
 * PageImages MediaWiki API query module.
 *
 * If there's no thumbnail, the thumbnail is too small, or the thumbnail's URL
 * contains characters that could be used to perform an
 * [XSS attack via CSS](https://www.owasp.org/index.php/Testing_for_CSS_Injection_(OTG-CLIENT-005)),
 * then `null` is returned.
 *
 * Extracted from `mw.popups.renderer.article.createThumbnail`.
 *
 * @param {Object} rawThumbnail
 * @return {ext.popups.Thumbnail|null}
 */
export function createThumbnail(rawThumbnail) {
  const devicePixelRatio = bracketedDevicePixelRatio();

  if (!rawThumbnail) {
    return null;
  }

  const tall = rawThumbnail.width < rawThumbnail.height;
  const thumbWidth = rawThumbnail.width / devicePixelRatio;
  const thumbHeight = rawThumbnail.height / devicePixelRatio;

  if (
    // Image too small for landscape display
    (!tall && thumbWidth < SIZES.landscapeImage.w) ||
    // Image too small for portrait display
    (tall && thumbHeight < SIZES.portraitImage.h) ||
    // These characters in URL that could inject CSS and thus JS
    (rawThumbnail.source.indexOf("\\") > -1 ||
      rawThumbnail.source.indexOf("'") > -1 ||
      rawThumbnail.source.indexOf('"') > -1)
  ) {
    return null;
  }

  let x, y, width, height;
  if (tall) {
    x =
      thumbWidth > SIZES.portraitImage.w
        ? (thumbWidth - SIZES.portraitImage.w) / -2
        : SIZES.portraitImage.w - thumbWidth;
    y =
      thumbHeight > SIZES.portraitImage.h
        ? (thumbHeight - SIZES.portraitImage.h) / -2
        : 0;
    width = SIZES.portraitImage.w;
    height = SIZES.portraitImage.h;
  } else {
    x = 0;
    y =
      thumbHeight > SIZES.landscapeImage.h
        ? (thumbHeight - SIZES.landscapeImage.h) / -2
        : 0;
    width = SIZES.landscapeImage.w;
    height =
      thumbHeight > SIZES.landscapeImage.h
        ? SIZES.landscapeImage.h
        : thumbHeight;
  }

  return {
    el: createThumbnailElement(
      tall ? "mwe-popups-is-tall" : "mwe-popups-is-not-tall",
      rawThumbnail.source,
      x,
      y,
      thumbWidth,
      thumbHeight,
      width,
      height
    ),
    isTall: tall,
    width: thumbWidth,
    height: thumbHeight
  };
}

/**
 * Creates the SVG image element that represents the thumbnail.
 *
 * This function is distinct from `createThumbnail` as it abstracts away some
 * browser issues that are uncovered when manipulating elements across
 * namespaces.
 *
 * @param {String} className
 * @param {String} url
 * @param {Number} x
 * @param {Number} y
 * @param {Number} thumbnailWidth
 * @param {Number} thumbnailHeight
 * @param {Number} width
 * @param {Number} height
 * @param {String} clipPath
 * @return {jQuery}
 */
export function createThumbnailElement(
  className,
  url,
  x,
  y,
  thumbnailWidth,
  thumbnailHeight,
  width,
  height
) {
  const nsSvg = "http://www.w3.org/2000/svg",
    nsXlink = "http://www.w3.org/1999/xlink";

  const thumbnailSVGImage = document.createElementNS(nsSvg, "image");
  thumbnailSVGImage.setAttributeNS(nsXlink, "href", url);
  thumbnailSVGImage.classList.add(className);
  thumbnailSVGImage.setAttribute("x", x);
  thumbnailSVGImage.setAttribute("y", y);
  thumbnailSVGImage.setAttribute("width", thumbnailWidth);
  thumbnailSVGImage.setAttribute("height", thumbnailHeight);

  const thumbnail = document.createElementNS(nsSvg, "svg");
  thumbnail.setAttribute("xmlns", nsSvg);
  thumbnail.setAttribute("width", width);
  thumbnail.setAttribute("height", height);
  thumbnail.appendChild(thumbnailSVGImage);

  return thumbnail;
}
