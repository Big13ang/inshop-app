import * as tus from 'tus-js-client';
import { env } from '@/env';

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
  ) { }

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
      credentials: 'include',
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
  ) { }

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

export interface UploadParams {
  id: string;
  file: File;
  onProgress: (pct: number) => void;
  signal: AbortSignal;
  options?: { uploadSessionId?: string };
}

export interface UploadStrategy {
  upload(params: UploadParams): Promise<string>;
}

const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB
const RETRY_DELAYS = [0, 1_000, 3_000, 5_000];

/**
 * Creates a DOMException matching standard browser abort behaviour.
 * @returns {DOMException} An abort DOMException.
 */
function abortedError(): DOMException {
  return new DOMException('Aborted', 'AbortError');
}

/**
 * Checks if the code is running under a test environment (e.g. Node/Jest).
 * @returns {boolean} True if NODE_ENV is 'test'.
 */
function isTestEnv(): boolean {
  return typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
}

/**
 * Patches the underlying XHR request object to include credentials.
 * This is crucial for sending cookies on cross-origin upload requests.
 * @param {tus.HttpRequest} req - The raw tus HTTP request object.
 */
function enableCredentials(req: tus.HttpRequest): void {
  const xhr = req.getUnderlyingObject();
  if (xhr && typeof xhr === 'object' && 'withCredentials' in xhr) {
    (xhr as { withCredentials: boolean }).withCredentials = true;
  }
}

/**
 * Arguments required to construct tus client options.
 */
interface BuildTusOptionsArgs {
  /** Parameters from the upload request containing file details and signal */
  params: UploadParams;
  /** The backend upload target endpoint */
  endpoint: string;
  /** Promise resolver callback to signal success */
  resolve: (url: string) => void;
  /** Promise rejecter callback to signal errors */
  reject: (reason: unknown) => void;
  /** Closure function retrieving the lazy-loaded tus Upload instance */
  getUpload: () => tus.Upload;
}

/**
 * Constructs the configuration options needed for tus-js-client.
 * @param {BuildTusOptionsArgs} args - Config configuration inputs.
 * @returns {tus.UploadOptions} Configured tus upload options.
 */
function buildTusOptions({
  params,
  endpoint,
  resolve,
  reject,
  getUpload,
}: BuildTusOptionsArgs): tus.UploadOptions {
  const { id, file, onProgress, options } = params;

  return {
    endpoint,
    chunkSize: CHUNK_SIZE,
    retryDelays: RETRY_DELAYS,
    removeFingerprintOnSuccess: true,
    ...(isTestEnv() ? { httpStack: new FetchHttpStack() } : {}),
    onBeforeRequest: enableCredentials,
    metadata: {
      id,
      filename: file.name,
      filetype: file.type,
      ...(options?.uploadSessionId ? { uploadSessionId: options.uploadSessionId } : {}),
    },
    onProgress(bytesUploaded, bytesTotal) {
      const percentage = bytesTotal > 0 ? Math.round((bytesUploaded / bytesTotal) * 100) : 0;
      onProgress(percentage);
    },
    onError: reject,
    onSuccess() {
      resolve(getUpload().url ?? `${endpoint}/${id}`);
    },
  };
}

/**
 * Attaches abort signal event listeners to cancel active uploads.
 * If aborted, it terminates the network request and rejects the promise.
 * @param {AbortSignal} signal - The abort controller signal.
 * @param {tus.Upload} upload - The active tus Upload client instance.
 * @param {(reason: unknown) => void} reject - Rejection callback.
 * @returns {() => void} A cleanup function to remove the listener.
 */
function wireAbortSignal(
  signal: AbortSignal,
  upload: tus.Upload,
  reject: (reason: unknown) => void,
): () => void {
  const onAbort = () => {
    upload.abort();
    reject(abortedError());
  };
  signal.addEventListener('abort', onAbort);
  return () => {
    signal.removeEventListener('abort', onAbort);
  };
}

/**
 * Resumes an upload from localStorage if one exists, otherwise starts a new upload.
 * @param {tus.Upload} upload - The tus Upload client instance.
 */
async function resumeOrStart(upload: tus.Upload): Promise<void> {
  const previous = await upload.findPreviousUploads();
  if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
  upload.start();
}

/**
 * Creates an upload strategy that uses chunked resumable uploading via the tus protocol.
 * @param {string} [endpoint] - Target URL endpoint for upload requests.
 * @returns {UploadStrategy} The chunked upload strategy implementation.
 */
export function createChunkStrategy(
  endpoint = `${env.NEXT_PUBLIC_API_URL}/uploads`,
): UploadStrategy {
  return {
    upload(params) {
      return new Promise((resolve, reject) => {
        if (params.signal.aborted) {
          reject(abortedError());
          return;
        }

        const cleanup = { abort: undefined as (() => void) | undefined };
        const safeResolve = (url: string) => {
          cleanup.abort?.();
          resolve(url);
        };
        const safeReject = (reason: unknown) => {
          cleanup.abort?.();
          reject(reason);
        };

        const tusOptions = buildTusOptions({
          params,
          endpoint,
          resolve: safeResolve,
          reject: safeReject,
          getUpload: () => tusUpload,
        });
        const tusUpload = new tus.Upload(params.file, tusOptions);

        cleanup.abort = wireAbortSignal(params.signal, tusUpload, safeReject);
        resumeOrStart(tusUpload).catch(safeReject);
      });
    },
  };
}
