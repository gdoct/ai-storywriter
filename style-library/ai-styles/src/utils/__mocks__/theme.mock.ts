// Mocks for window/document for theme utils edge cases
export function mockNoWindow() {
  // @ts-ignore
  const origWindow = globalThis.window;
  // @ts-ignore
  delete globalThis.window;
  return () => {
    // @ts-ignore
    globalThis.window = origWindow;
  };
}

export function mockNoDocument() {
  // @ts-ignore
  const origDocument = globalThis.document;
  // @ts-ignore
  delete globalThis.document;
  return () => {
    // @ts-ignore
    globalThis.document = origDocument;
  };
}
