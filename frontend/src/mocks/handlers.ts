// src/mocks/handlers.ts
import { http, HttpResponse, delay } from "msw";

export const handlers = [
  http.post("/api/recordings", async ({ request }) => {
    // Simulate network/processing delay
    await delay(600);

    // Random failures to test your one-shot submit + UI
    if (Math.random() < 0.15) {
      return HttpResponse.text("Mock 500", { status: 500 });
    }

    // Read the multipart form
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const session_id = form.get("session_id");
    const request_id = form.get("request_id");

    const meta = file
      ? { name: file.name, type: file.type, size: file.size }
      : { name: null, type: null, size: 0 };

    return HttpResponse.json({
      ok: true,
      receivedAt: Date.now(),
      session_id,
      request_id,
      file: meta,
      // you can echo anything else you need for assertions
    });
  }),
];
