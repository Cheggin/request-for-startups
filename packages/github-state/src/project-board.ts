/**
 * Manage GitHub Project board columns.
 * Uses `gh project` commands to list items and move cards between columns.
 */

import { execGh, execGhJson } from "./gh.js";
import { COLUMNS, type Column } from "./constants.js";

export interface ProjectItem {
  id: string;
  title: string;
  status: string;
  content: {
    number: number;
    type: string;
  };
}

export interface ProjectConfig {
  projectNumber: number;
  owner: string;
}

/**
 * List all items in the project board, optionally filtered by column.
 */
export async function listProjectItems(
  config: ProjectConfig,
  column?: Column
): Promise<ProjectItem[]> {
  const args = [
    "project",
    "item-list",
    String(config.projectNumber),
    "--owner",
    config.owner,
    "--format",
    "json",
    "--limit",
    "200",
  ];

  const result = await execGhJson<{ items: ProjectItem[] }>(args);
  const items = result.items ?? [];

  if (column) {
    return items.filter((item) => item.status === column);
  }
  return items;
}

/**
 * Find the project item ID for a given Issue number.
 */
export async function findItemByIssue(
  config: ProjectConfig,
  issueNumber: number
): Promise<ProjectItem | null> {
  const items = await listProjectItems(config);
  return items.find((item) => item.content?.number === issueNumber) ?? null;
}

/**
 * Move an Issue's card to a different column on the project board.
 * Requires the project's Status field ID and option IDs.
 */
export async function moveCard(
  config: ProjectConfig,
  itemId: string,
  targetColumn: Column,
  statusFieldId: string
): Promise<void> {
  // Get the option ID for the target column
  const optionId = await getColumnOptionId(config, statusFieldId, targetColumn);

  await execGh([
    "project",
    "item-edit",
    "--project-id",
    String(config.projectNumber),
    "--id",
    itemId,
    "--field-id",
    statusFieldId,
    "--single-select-option-id",
    optionId,
  ]);
}

/**
 * Get the option ID for a column name within the Status field.
 */
export async function getColumnOptionId(
  config: ProjectConfig,
  statusFieldId: string,
  columnName: Column
): Promise<string> {
  const result = await execGhJson<{
    fields: { id: string; name: string; options?: { id: string; name: string }[] }[];
  }>([
    "project",
    "field-list",
    String(config.projectNumber),
    "--owner",
    config.owner,
    "--format",
    "json",
  ]);

  const statusField = result.fields?.find((f) => f.id === statusFieldId);
  if (!statusField) {
    throw new Error(`Status field ${statusFieldId} not found in project`);
  }

  const option = statusField.options?.find((o) => o.name === columnName);
  if (!option) {
    throw new Error(`Column "${columnName}" not found in status field options`);
  }

  return option.id;
}

/**
 * Add an Issue to the project board.
 * Returns the item ID.
 */
export async function addIssueToProject(
  config: ProjectConfig,
  issueUrl: string
): Promise<string> {
  const result = await execGh([
    "project",
    "item-add",
    String(config.projectNumber),
    "--owner",
    config.owner,
    "--url",
    issueUrl,
  ]);

  // gh project item-add outputs the item ID
  return result.stdout.trim();
}

/**
 * Convenience: transition an Issue to a new column.
 * Finds the item, then moves it.
 */
export async function transitionIssue(
  config: ProjectConfig,
  issueNumber: number,
  targetColumn: Column,
  statusFieldId: string
): Promise<void> {
  const item = await findItemByIssue(config, issueNumber);
  if (!item) {
    throw new Error(`Issue #${issueNumber} not found on project board`);
  }
  await moveCard(config, item.id, targetColumn, statusFieldId);
}

/**
 * Get all columns (status options) configured on the project.
 */
export async function getColumns(
  config: ProjectConfig
): Promise<{ id: string; name: string }[]> {
  const result = await execGhJson<{
    fields: { id: string; name: string; options?: { id: string; name: string }[] }[];
  }>([
    "project",
    "field-list",
    String(config.projectNumber),
    "--owner",
    config.owner,
    "--format",
    "json",
  ]);

  const statusField = result.fields?.find((f) => f.name === "Status");
  return statusField?.options ?? [];
}
