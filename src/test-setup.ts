import "@testing-library/jest-dom";

// jsdom mocks
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = () => {};
}
