declare module 'scrollama' {
  export interface ScrollamaResponse {
    element: Element;
    index: number;
    direction: 'up' | 'down';
  }

  export interface ScrollamaSetupOptions {
    step: string | NodeListOf<Element> | Element[];
    offset?: number;
    progress?: boolean;
    threshold?: number;
    debug?: boolean;
    container?: string | Element;
    parent?: string | Element;
    once?: boolean;
  }

  export interface ScrollamaInstance {
    setup(options: ScrollamaSetupOptions): ScrollamaInstance;
    onStepEnter(cb: (response: ScrollamaResponse) => void): ScrollamaInstance;
    onStepExit(cb: (response: ScrollamaResponse) => void): ScrollamaInstance;
    onStepProgress(cb: (response: ScrollamaResponse & { progress: number }) => void): ScrollamaInstance;
    resize(): void;
    destroy(): void;
    enable(): void;
    disable(): void;
  }

  export default function scrollama(): ScrollamaInstance;
}
