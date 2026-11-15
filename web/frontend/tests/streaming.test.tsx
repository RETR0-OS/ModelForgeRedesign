import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";

import { AppProviders, AppRoutes } from "@/App";
import { setToken } from "@/lib/api";

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}

it("opens a model session, streams tokens, and stops generation", async () => {
  setToken("secret");
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path.includes("/api/system")) {
      return json({
        name: "ModelForge",
        package: "modelforge-finetuning",
        version: "4.0.0",
        providers: [],
        strategies: [],
        use_cases: [],
      });
    }
    if (path.includes("/api/hardware")) {
      return json({
        physical_core_count: 8,
        disk_storage_gb: 100,
        available_disk_storage_gb: 40,
        ram_gb: 32,
        gpus: [],
      });
    }
    if (path.includes("/api/runs")) return json({ runs: [] });
    if (path.includes("/api/models")) {
      return json({
        models: [
          {
            id: 1,
            name: "Tiny fine-tune",
            task_slug: "causal_language_modeling",
            description: null,
            model_path: "/model",
            pushed_to_hub: false,
            created_at: "2026-01-01",
            base_model: "example/model",
          },
        ],
      });
    }
    if (path.includes("/api/playground/status")) {
      return json({ available: true, reason: null, session_id: null });
    }
    if (path.endsWith("/api/playground/sessions") && init?.method === "POST") {
      return json({
        session_id: "session1",
        model_path: "/model",
        base_model: "example/model",
        note: null,
      });
    }
    return json({});
  });
  vi.stubGlobal("fetch", fetchMock);

  class Socket {
    static latest: Socket;
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    send = vi.fn();

    constructor(public url: string) {
      Socket.latest = this;
    }

    close() {
      this.onclose?.();
    }
  }
  vi.stubGlobal("WebSocket", Socket);

  render(
    <MemoryRouter initialEntries={["/app/playground"]}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );

  fireEvent.click(await screen.findByRole("button", { name: /Tiny fine-tune/ }));
  expect(await screen.findByText("Loaded Tiny fine-tune. Say something to start.")).toBeTruthy();

  fireEvent.change(
    screen.getByPlaceholderText("Send a message. Enter to send, Shift+Enter for a new line."),
    { target: { value: "Hello" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Send" }));

  const socket = Socket.latest;
  socket.onopen?.();
  expect(socket.url).toContain("/api/playground/session1/chat?token=secret");
  expect(JSON.parse(socket.send.mock.calls[0][0] as string).messages.at(-1)).toEqual({
    role: "user",
    content: "Hello",
  });
  socket.onmessage?.({ data: JSON.stringify({ type: "token", text: "Hi!" }) });
  expect(await screen.findByText("Hi!")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  expect(JSON.parse(socket.send.mock.calls[1][0] as string)).toEqual({ type: "stop" });
  socket.onmessage?.({ data: JSON.stringify({ type: "done" }) });
  await waitFor(() => expect(screen.getByRole("button", { name: "Send" })).toBeTruthy());

  fireEvent.click(screen.getByRole("button", { name: "Unload model" }));
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/playground/sessions/session1",
      expect.objectContaining({ method: "DELETE" }),
    ),
  );
});
