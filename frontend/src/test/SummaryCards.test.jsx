import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SummaryCards from "../components/SummaryCards";

describe("SummaryCards", () => {
  it("links spam and ham cards to filtered history views", () => {
    render(
      <MemoryRouter>
        <SummaryCards
          stats={{
            spam_count: 342,
            ham_count: 1029,
            buckets: [],
          }}
          highConfidenceShare={0.81}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/spam detected/i).closest("a")).toHaveAttribute(
      "href",
      "/history?filter=spam",
    );
    expect(screen.getByText(/legitimate \(ham\)/i).closest("a")).toHaveAttribute(
      "href",
      "/history?filter=ham",
    );
  });
});
