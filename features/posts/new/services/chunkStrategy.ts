import * as tus from 'tus-js-client';

// tus-js-client's default XHRHttpStack sends Blob chunk bodies via
// XMLHttpRequest.send(). MSW's XHR interceptor (used in tests) doesn't relay
// Blob bodies correctly, and fetch is the modern standard anyway — so we
// implement the same httpStack interface backed by fetch instead.
export class FetchRequest implements tus.HttpRequest {
  private headers: Record<string, string> = {};
  private controller = new AbortController();

  constructor(
    private method: string,
    private url: string,
  ) {}

  getMethod(): string {
    return this.method;
  }

  getURL(): string {
    return this.url;
  }

  setHeader(header: string, value: string): void {
    this.headers[header] = value;
  }

  getHeader(header: string): string | undefined {
    return this.headers[header];
  }

  setProgressHandler(): void {
    // fetch has no native upload-progress API; per-chunk progress is still
    // emitted by tus-js-client itself once each chunk request resolves.
  }

  async send(body?: Blob | BodyInit): Promise<tus.HttpResponse> {
    // Some fetch interceptors (e.g. MSW under jsdom) mis-handle Blob bodies,
    // so send the underlying bytes directly instead. Duck-typed rather than
    // `instanceof Blob` since jsdom and Node can expose distinct Blob globals.
    const sendBody =
      body && typeof (body as Blob).arrayBuffer === 'function'
        ? await (body as Blob).arrayBuffer()
        : body;
    const res = await fetch(this.url, {
      method: this.method,
      headers: this.headers,
      body: sendBody,
      signal: this.controller.signal,
    });
    return new FetchResponse(res, await res.text());
  }

  abort(): Promise<void> {
    this.controller.abort();
    return Promise.resolve();
  }

  getUnderlyingObject(): unknown {
    return this;
  }
}

class FetchResponse implements tus.HttpResponse {
  constructor(
    private res: Response,
    private body: string,
  ) {}

  getStatus(): number {
    return this.res.status;
  }

  getHeader(header: string): string | undefined {
    return this.res.headers.get(header) ?? undefined;
  }

  getBody(): string {
    return this.body;
  }

  getUnderlyingObject(): unknown {
    return this.res;
  }
}

export class FetchHttpStack implements tus.HttpStack {
  createRequest(method: string, url: string): tus.HttpRequest {
    return new FetchRequest(method, url);
  }

  getName(): string {
    return 'FetchHttpStack';
  }
}

export interface UploadStrategy {
  upload(
    id: string,
    file: File,
    onProgress: (pct: number) => void,
    signal: AbortSignal,
  ): Promise<string>;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
const RETRY_DELAYS = [0, 1_000, 3_000, 5_000];

export function createChunkStrategy(endpoint = '/api/upload'): UploadStrategy {
  return {
    upload(id, file, onProgress, signal): Promise<string> {
      return new Promise((resolve, reject) => {
        if (signal.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }

        const upload = new tus.Upload(file, {
          endpoint,
          chunkSize: CHUNK_SIZE,
          retryDelays: RETRY_DELAYS,
          removeFingerprintOnSuccess: true,
          httpStack: new FetchHttpStack(),
          metadata: { id, filename: file.name, filetype: file.type },
          onProgress: (bytesUploaded, bytesTotal) => {
            onProgress(Math.round((bytesUploaded / bytesTotal) * 100));
          },
          onError: reject,
          onSuccess: () => resolve(upload.url ?? `${endpoint}/${id}`),
        });

        signal.addEventListener('abort', () => {
          upload.abort();
          reject(new DOMException('Aborted', 'AbortError'));
        });

        void upload.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length) upload.resumeFromPreviousUpload(previousUploads[0]);
          upload.start();
        });
      });
    },
  };
}
