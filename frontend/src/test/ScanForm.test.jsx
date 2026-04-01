import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ScanForm from "../components/ScanForm";

describe("ScanForm", () => {
  it("shows validation feedback for short messages", () => {
    render(<ScanForm onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "short" },
    });

    expect(
      screen.getByText("Message is too short (min 10 characters)."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /initiate analysis/i }),
    ).toBeDisabled();
  });

  it("submits a trimmed website message", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ScanForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "   suspicious offer link   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /initiate analysis/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        message: "suspicious offer link",
        source: "website",
      }),
    );
  });
});
