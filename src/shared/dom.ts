export function queryElementById(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Required DOM element "#${id}" not found.`);
  }
  return element;
}

export function queryCanvasById(id: string): HTMLCanvasElement {
  const element = queryElementById(id);
  if (!(element instanceof HTMLCanvasElement)) {
    throw new Error(`Element "#${id}" is not a <canvas> element.`);
  }
  return element;
}
