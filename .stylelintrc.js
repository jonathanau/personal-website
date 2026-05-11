module.exports = {
  extends: 'stylelint-config-standard',
  rules: {
    'selector-type-no-unknown': [true, { ignore: ['custom-elements'] }],
    'property-no-unknown': [true, {
      ignoreProperties: [
        'backdrop-filter',
        'scrollbar-color',
        'scrollbar-width',
        'color-scheme',
        '-webkit-background-clip',
        '-webkit-backdrop-filter',
      ],
    }],
    'no-descending-specificity': null,
    'declaration-block-no-duplicate-properties': null,
    'color-function-alias-notation': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'color-hex-length': null,
    'media-feature-range-notation': null,
    'comment-empty-line-before': null,
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
  },
};