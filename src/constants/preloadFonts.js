// Aeonik and Poppins weights are used above the fold on every page (headings,
// nav, body text), so we preload them via docusaurus.config.js's headTags —
// letting the browser fetch them before it even has HTML to parse a <link>
// tag from, or CSS to parse an @font-face from. This needs the literal
// webpack output filename, which is content-hashed and only changes if these
// specific font files' bytes change.
//
// bin/check-font-preload-hash.js fails `yarn build` if these drift from the
// real build output, and prints the values to paste in here.
module.exports = {
  AEONIK_REGULAR_FILENAME: "Aeonik-Regular-339030ba4308b7630f2de14a0ef43399.woff",
  AEONIK_BOLD_FILENAME: "Aeonik-Bold-87b0696142a6e3256f4879e1709cdc43.woff",
  AEONIK_LIGHT_FILENAME: "Aeonik-Light-bf57c30caa36476cc75784f0f05c6433.woff",
  POPPINS_REGULAR_FILENAME: "Poppins-Regular-35d26b781dc5fda684cce6ea04a41a75.ttf",
  POPPINS_MEDIUM_FILENAME: "Poppins-Medium-673ed42382ab264e0bf5b33f3579568c.ttf",
  POPPINS_SEMIBOLD_FILENAME: "Poppins-SemiBold-ac8d04b620e54be9b0f0f4851d56e4dd.ttf",
  POPPINS_BOLD_FILENAME: "Poppins-Bold-cdb29a5d7ccf57ff05a3fd9216d11771.ttf",
};
