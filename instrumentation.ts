export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.on("unhandledRejection", (reason: unknown) => {
      console.error("UNHANDLED_REJECTION", {
        reason: reason instanceof Error ? reason.stack : String(reason),
      });
    });

    process.on("uncaughtException", (err: Error) => {
      console.error("UNCAUGHT_EXCEPTION", {
        message: err.message,
        stack: err.stack,
      });
    });
  }
}
