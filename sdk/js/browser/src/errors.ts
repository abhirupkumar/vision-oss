export const initErrorsTracking = (send: (payload: any, type: string) => void, getPayload: () => any) => {
  window.addEventListener("error", (event) => {
    send(
      {
        ...getPayload(),
        errorType: (event.error && event.error.name) || "Error",
        message:
          event.message ||
          (event.error && event.error.message) ||
          String(event),
        stack: event.error ? event.error.stack : undefined,
        timestamp: Date.now(),
        level: "error",
      },
      "error",
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    send(
      {
        ...getPayload(),
        errorType: event.reason
          ? event.reason.name || "UnhandledRejection"
          : "UnhandledRejection",
        message: event.reason
          ? event.reason.message || String(event.reason)
          : "Promise rejection",
        stack: event.reason ? event.reason.stack : undefined,
        timestamp: Date.now(),
        level: "error",
      },
      "error",
    );
  });
};
