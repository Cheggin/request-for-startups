import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/gh.js", () => ({
  execGh: vi.fn(),
  execGhJson: vi.fn(),
}));

import { execGh, execGhJson } from "../src/gh.js";
import {
  listProjectItems,
  findItemByIssue,
  moveCard,
  addIssueToProject,
  transitionIssue,
  getColumns,
  getColumnOptionId,
} from "../src/project-board.js";
import { COLUMNS } from "../src/constants.js";

const mockExecGh = vi.mocked(execGh);
const mockExecGhJson = vi.mocked(execGhJson);

const CONFIG = { projectNumber: 1, owner: "test-org" };

const SAMPLE_ITEMS = {
  items: [
    {
      id: "item-1",
      title: "Issue A",
      status: "Backlog",
      content: { number: 10, type: "Issue" },
    },
    {
      id: "item-2",
      title: "Issue B",
      status: "In Progress",
      content: { number: 20, type: "Issue" },
    },
    {
      id: "item-3",
      title: "Issue C",
      status: "Done",
      content: { number: 30, type: "Issue" },
    },
  ],
};

const FIELD_LIST = {
  fields: [
    {
      id: "status-field-1",
      name: "Status",
      options: [
        { id: "opt-backlog", name: "Backlog" },
        { id: "opt-inprogress", name: "In Progress" },
        { id: "opt-inreview", name: "In Review" },
        { id: "opt-done", name: "Done" },
      ],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listProjectItems", () => {
  it("returns all items when no column filter", async () => {
    mockExecGhJson.mockResolvedValue(SAMPLE_ITEMS);
    const items = await listProjectItems(CONFIG);
    expect(items).toHaveLength(3);
  });

  it("filters by column", async () => {
    mockExecGhJson.mockResolvedValue(SAMPLE_ITEMS);
    const items = await listProjectItems(CONFIG, COLUMNS.IN_PROGRESS);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Issue B");
  });

  it("passes correct args to gh", async () => {
    mockExecGhJson.mockResolvedValue(SAMPLE_ITEMS);
    await listProjectItems(CONFIG);
    const args = mockExecGhJson.mock.calls[0][0];
    expect(args).toContain("project");
    expect(args).toContain("item-list");
    expect(args).toContain("1");
    expect(args).toContain("--owner");
    expect(args).toContain("test-org");
  });
});

describe("findItemByIssue", () => {
  it("finds item by issue number", async () => {
    mockExecGhJson.mockResolvedValue(SAMPLE_ITEMS);
    const item = await findItemByIssue(CONFIG, 20);
    expect(item).not.toBeNull();
    expect(item!.id).toBe("item-2");
  });

  it("returns null for unknown issue", async () => {
    mockExecGhJson.mockResolvedValue(SAMPLE_ITEMS);
    const item = await findItemByIssue(CONFIG, 999);
    expect(item).toBeNull();
  });
});

describe("moveCard", () => {
  it("calls item-edit with correct field and option", async () => {
    mockExecGhJson.mockResolvedValue(FIELD_LIST);
    mockExecGh.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });

    await moveCard(CONFIG, "item-2", COLUMNS.IN_REVIEW, "status-field-1");

    expect(mockExecGh).toHaveBeenCalledOnce();
    const args = mockExecGh.mock.calls[0][0];
    expect(args).toContain("item-edit");
    expect(args).toContain("--single-select-option-id");
    expect(args).toContain("opt-inreview");
  });
});

describe("getColumnOptionId", () => {
  it("returns option ID for valid column", async () => {
    mockExecGhJson.mockResolvedValue(FIELD_LIST);
    const id = await getColumnOptionId(CONFIG, "status-field-1", COLUMNS.DONE);
    expect(id).toBe("opt-done");
  });

  it("throws for unknown field ID", async () => {
    mockExecGhJson.mockResolvedValue(FIELD_LIST);
    await expect(
      getColumnOptionId(CONFIG, "nonexistent", COLUMNS.DONE)
    ).rejects.toThrow("not found");
  });

  it("throws for unknown column name", async () => {
    mockExecGhJson.mockResolvedValue(FIELD_LIST);
    await expect(
      getColumnOptionId(CONFIG, "status-field-1", "Nonexistent" as any)
    ).rejects.toThrow("not found");
  });
});

describe("addIssueToProject", () => {
  it("calls item-add with correct args", async () => {
    mockExecGh.mockResolvedValue({ stdout: "new-item-id\n", stderr: "", exitCode: 0 });
    const id = await addIssueToProject(CONFIG, "https://github.com/org/repo/issues/42");
    expect(id).toBe("new-item-id");
    const args = mockExecGh.mock.calls[0][0];
    expect(args).toContain("item-add");
    expect(args).toContain("--url");
  });
});

describe("transitionIssue", () => {
  it("finds item then moves it", async () => {
    // First call: listProjectItems -> findItemByIssue
    // Second call: getColumnOptionId
    mockExecGhJson
      .mockResolvedValueOnce(SAMPLE_ITEMS) // findItemByIssue -> listProjectItems
      .mockResolvedValueOnce(FIELD_LIST); // getColumnOptionId
    mockExecGh.mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });

    await transitionIssue(CONFIG, 20, COLUMNS.IN_REVIEW, "status-field-1");

    expect(mockExecGh).toHaveBeenCalledOnce();
  });

  it("throws when issue not on board", async () => {
    mockExecGhJson.mockResolvedValue(SAMPLE_ITEMS);
    await expect(
      transitionIssue(CONFIG, 999, COLUMNS.DONE, "status-field-1")
    ).rejects.toThrow("not found on project board");
  });
});

describe("getColumns", () => {
  it("returns status options", async () => {
    mockExecGhJson.mockResolvedValue(FIELD_LIST);
    const cols = await getColumns(CONFIG);
    expect(cols).toHaveLength(4);
    expect(cols.map((c) => c.name)).toContain("Backlog");
    expect(cols.map((c) => c.name)).toContain("Done");
  });
});
