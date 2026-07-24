import * as tus from 'tus-js-client';

class FetchRequest implements tus.HttpRequest {
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

  setProgressHandler(): void {}

  async send(body?: Blob | BodyInit): Promise<tus.HttpResponse> {
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
