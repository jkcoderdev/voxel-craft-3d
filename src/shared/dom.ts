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

export function queryElementBySelector(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Required DOM element "${selector}" not found.`);
  }
  return element;
}

export function queryCanvasBySelector(selector: string): HTMLCanvasElement {
  const element = queryElementBySelector(selector);
  if (!(element instanceof HTMLCanvasElement)) {
    throw new Error(`Element "${selector}" is not a <canvas> element.`);
  }
  return element;
}
