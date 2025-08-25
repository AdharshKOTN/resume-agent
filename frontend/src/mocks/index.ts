// src/mocks/index.ts
export async function startMocks() {
  if (process.env.NODE_ENV === "development") {
    const { worker } = await import("./browser");
    await worker.start({
      onUnhandledRequest: "bypass", // let everything else hit the real net
    });
    console.log("[MSW] recording API mocked");
  }
}
