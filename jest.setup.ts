import "@testing-library/jest-dom";
import fetchMock from "jest-fetch-mock";

fetchMock.enableMocks();

/* Browser-only patch ------------------------------------------------------- */
if (typeof window !== "undefined") {
  if (typeof window.location.reload !== "function") {
    const loc = window.location as any;

    // add stub if reload doesn't exist
    if (!("reload" in loc)) {
      loc.reload = jest.fn();
    }
  }
}
