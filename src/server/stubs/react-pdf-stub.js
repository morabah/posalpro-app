// Server-side stub for react-pdf to avoid importing pdfjs-dist on the server.
// Exports minimal shims used in client-only code paths.

const React = require('react');

function NullComponent() {
  return null;
}

module.exports = {
  Document: NullComponent,
  Page: NullComponent,
  Outline: NullComponent,
  Thumbnail: NullComponent,
  pdfjs: {},
};

