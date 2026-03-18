import { fireEvent, render, screen } from "@testing-library/react";
import HistoryTable from "../components/HistoryTable";

const records = [
  {
    id: 1,
    timestamp: "2026-03-18T10:00:00.000Z",
    source: "website",
    message:
      "This is a very long suspicious message that should be truncated in the table preview because it exceeds one hundred characters and continues with more bait text.",
    result: "spam",
    confidence: 0.91,
  },
];

describe("HistoryTable", () => {
  it("shows empty state when there are no records", () => {
    render(<HistoryTable records={[]} onDelete={vi.fn()} />);

    expect(screen.getByText(/no scan history yet/i)).toBeInTheDocument();
  });

  it("expands a message preview and supports deletion", () => {
    const onDelete = vi.fn();
    render(<HistoryTable records={records} onDelete={onDelete} />);

    const expandButton = screen.getAllByRole("button", { name: /expand/i })[0];
    fireEvent.click(expandButton);

    expect(screen.getAllByText(/show less/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
