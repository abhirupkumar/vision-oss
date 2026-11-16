/**
 * ReadableInterceptor
 *
 * Wraps a provider's ReadableStream in a TransformStream so that:
 *  1. Every chunk is forwarded to the client IMMEDIATELY with zero added latency.
 *  2. All chunks are accumulated in an internal buffer concurrently.
 *  3. donePromise resolves with the full (or partial) buffer when the stream ends,
 *     the client disconnects, or a 30-minute timeout is hit.
 *
 * This is the same architecture used by Helicone's worker proxy.
 */

export interface CompletedStream {
  /** All accumulated decoded text chunks (partial if cancelled or timed out). */
  body: string[];
  /** How the stream ended. */
  reason: 'done' | 'cancel' | 'timeout';
  /** Unix ms timestamp when the stream ended. */
  endTime: number;
  /** Unix ms timestamp of the first non-empty chunk — used for TTFT calculation. Null for non-streaming. */
  firstChunkTime: number | null;
}

export class ReadableInterceptor {
  private buffer: string[] = [];
  private decoder = new TextDecoder('utf-8');
  private firstChunkTime: number | null = null;
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private doneResolve!: (v: CompletedStream) => void;
  private settled = false; // guard against double-resolve

  /** Resolves after the stream ends via any of the three termination paths. */
  public donePromise: Promise<CompletedStream>;

  /**
   * The intercepted ReadableStream.
   * Pass this directly to `new Response(interceptor.stream, ...)` — the client
   * will receive every chunk with zero added latency.
   */
  public stream: ReadableStream;

  constructor(
    original: ReadableStream,
    private readonly TIMEOUT_MS = 30 * 60 * 1000, // 30 minutes
  ) {
    this.donePromise = new Promise((resolve) => {
      this.doneResolve = resolve;
    });
    this.stream = this.intercept(original);

    // Hard timeout — resolves with partial buffer if provider hangs
    this.timeoutHandle = setTimeout(() => this.emit('timeout'), this.TIMEOUT_MS);
  }

  private emit(reason: CompletedStream['reason']): void {
    if (this.settled) return; // prevent double-resolve
    this.settled = true;
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    this.doneResolve({
      body: this.buffer,
      reason,
      endTime: Date.now(),
      firstChunkTime: this.firstChunkTime,
    });
  }

  private intercept(original: ReadableStream): ReadableStream {
    const transform = new TransformStream<Uint8Array, Uint8Array>({
      transform: (chunk, controller) => {
        // 1. Forward chunk to client IMMEDIATELY — zero added latency
        controller.enqueue(chunk);

        // 2. Accumulate in internal buffer (same synchronous tick, no await)
        const text = this.decoder.decode(chunk, { stream: true });
        if (this.firstChunkTime === null && text.trim().length > 0) {
          this.firstChunkTime = Date.now();
        }
        this.buffer.push(text);
      },

      // Called when the provider closes the upstream stream normally
      flush: () => {
        this.emit('done');
      },
    });

    // Pipe original provider stream into the writable side.
    // pipeTo() rejects when the readable side (client) is cancelled — handled below.
    original.pipeTo(transform.writable).catch(() => {
      // Intentional no-op: cancellation is handled via the readable.cancel() override below.
    });

    // Override readable.cancel() — called by the Fetch/HTTP layer when the TCP
    // connection from the client is dropped (browser tab close, network loss,
    // stream.destroy(), response.body.cancel(), etc.).
    // This is guaranteed by the Web Streams spec and Cloudflare Workers runtime.
    const readable = transform.readable;
    const originalCancel = readable.cancel.bind(readable);
    (readable as any).cancel = (reason?: any): Promise<void> => {
      this.emit('cancel'); // ← partial buffer is preserved and written to DB
      return originalCancel(reason);
    };

    return readable;
  }
}
