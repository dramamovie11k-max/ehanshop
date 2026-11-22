import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock API layer BEFORE importing the component
vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));
vi.mock("@/lib/dataApi", () => ({
  createOrder: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "admin-1", email: "admin@test.com" } }),
}));

import { apiFetch } from "@/lib/apiClient";
import ManualOrderDialog from "@/components/admin/ManualOrderDialog";

const renderDialog = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ManualOrderDialog open={true} onOpenChange={() => {}} />
    </QueryClientProvider>
  );
};

describe("ManualOrderDialog (white-screen regression)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing when products API returns null", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url: string) => {
      if (url.startsWith("/settings")) return [];
      if (url.startsWith("/products")) return null as any; // null products — the bug case
      return null as any;
    });

    renderDialog();

    // Dialog should render and no TypeError should be thrown
    expect(await screen.findByText(/ফোনে অর্ডার নিন/)).toBeInTheDocument();
  });

  it("renders without crashing when products API returns a wrapped { data: null } response", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url: string) => {
      if (url.startsWith("/settings")) return { data: [] } as any;
      if (url.startsWith("/products")) return { data: null } as any;
      return null as any;
    });

    renderDialog();

    await waitFor(() => {
      expect(screen.queryByText(/ফোনে অর্ডার নিন/)).toBeInTheDocument();
    });
  });

  it("renders without crashing when products API rejects (network error)", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url: string) => {
      if (url.startsWith("/settings")) throw new Error("network");
      if (url.startsWith("/products")) throw new Error("network");
      return null as any;
    });

    renderDialog();

    await waitFor(() => {
      expect(screen.queryByText(/ফোনে অর্ডার নিন/)).toBeInTheDocument();
    });
  });

  it("renders the product list when products are returned as an array", async () => {
    vi.mocked(apiFetch).mockImplementation(async (url: string) => {
      if (url.startsWith("/settings")) return [];
      if (url.startsWith("/products"))
        return [
          { id: "p1", name: "Test Product", name_bn: "টেস্ট", price: 100, stock_quantity: 5 },
        ] as any;
      return null as any;
    });

    renderDialog();

    expect(await screen.findByText("টেস্ট")).toBeInTheDocument();
  });
});
