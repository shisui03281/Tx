import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        allowpopups?: string;
        webpreferences?: string;
        onDidStartLoading?: () => void;
        onDidStopLoading?: () => void;
        onDidFailLoad?: (event: any) => void;
      }, HTMLElement>;
    }
  }
}

interface WebViewElement extends HTMLElement {
  loadURL(url: string): void;
  goBack(): void;
  goForward(): void;
  reload(): void;
  getURL(): string;
  getTitle(): string;
}

declare global {
  interface Window {
    electron?: {
      platform: string;
    };
  }
}

