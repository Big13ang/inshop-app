// Module worker: decode (native) -> resize (jSquash lanczos3) -> encode (jSquash WebP).
// jSquash auto-loads its WASM through `new URL(..., import.meta.url)`, which the bundler
// resolves (see node_modules/@jsquash/webp/README.md "Manual WASM initialisation (not recommended)").
import encodeWebp, { init as initWebpEncoder } from '@jsquash/webp/encode';
import resize, { initResize } from '@jsquash/resize';
import type { PixelCodec } from './compressionPolicy';
import type { CompressionRequest, CompressionResponse } from './types';
import { createRequestHandler, decodePixels } from './workerHandler';

// libwebp effort 4 matches the backend's Sharp `effort: 4`.
const WEBP_METHOD = 4;

const webpCodec: PixelCodec<ImageData> = {
    resize: (source, width, height) =>
        resize(source, { width, height, method: 'lanczos3', fitMethod: 'stretch' }),
    // use_sharp_yuv is libwebp's equivalent of Sharp's smartSubsample (backend uses it).
    encode: (image, quality) =>
        encodeWebp(image, { quality, method: WEBP_METHOD, use_sharp_yuv: 1 }),
};

function post(response: CompressionResponse, transfer: Transferable[] = []) {
    self.postMessage(response, { transfer });
}

function initCodecs() {
    return Promise.all([initWebpEncoder(), initResize()]);
}

const handleRequest = createRequestHandler({
    decode: decodePixels,
    codec: webpCodec,
    initCodecs,
    post,
});

function handleMessage(event: MessageEvent<CompressionRequest>) {
    void handleRequest(event.data);
}

self.onmessage = handleMessage;
