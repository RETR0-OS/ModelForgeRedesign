import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppProviders, AppRoutes } from "@/App";
import { api, captureStartupToken } from "@/lib/api";

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/app?token=startup-secret&stay=1");
  captureStartupToken();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
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
          physical_core_count: 4,
          disk_storage_gb: 20,
          available_disk_storage_gb: 10,
          ram_gb: 16,
          gpus: [],
        });
      }
      if (path.includes("/api/runs")) return json({ runs: [] });
      if (path.includes("/api/models")) return json({ models: [] });
      if (path.includes("/api/playground/status")) {
        return json({ available: true, reason: null, session_id: null });
      }
      return json({});
    }),
  );
});

describe("redesigned workbench routes", () => {
  it("renders the current session-based playground", async () => {
    render(
      <MemoryRouter initialEntries={["/app/playground"]}>
        <AppProviders>
          <AppRoutes />
        </AppProviders>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Playground" })).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Nothing to talk to yet" })).toBeTruthy();
  });

  it("retains the startup token when rendering a workbench route", async () => {
    render(
      <MemoryRouter initialEntries={["/app/docs"]}>
        <AppProviders>
          <AppRoutes />
        </AppProviders>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Documentation" })).toBeTruthy();
    expect(window.location.search).toBe("?stay=1");
    const fetchMock = vi.mocked(fetch);
    await api.health();
    const healthCall = fetchMock.mock.calls.find((call) => String(call[0]).includes("/api/health"));
    const headers = (healthCall?.[1] as RequestInit).headers as Record<string, string>;
    expect(headers["X-ModelForge-Token"]).toBe("startup-secret");
  });
});
