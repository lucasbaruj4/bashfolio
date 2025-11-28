import { Directory } from "./directory";

function normalizeDirectoryName(name: string): string {
  if (!name || name === "/") {
    return "";
  }
  return name.endsWith("/") ? name.slice(0, -1) : name;
}

function normalizePathString(path?: string): string {
  if (!path) {
    return "/";
  }

  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  let normalized = trimmed;
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/+$/, "");
  if (!normalized) {
    return "/";
  }

  return normalized;
}

export default function Path(rootDirectory: Directory, currentDir: Directory, previousPath?: string): string {
  if (currentDir === rootDirectory) {
    return "/";
  }

  const basePath = previousPath ? normalizePathString(previousPath) : "/";
  const segment = normalizeDirectoryName(currentDir.name);

  if (!segment) {
    return "/";
  }

  return basePath === "/" ? `/${segment}` : `${basePath}/${segment}`;
}

export function removePath(previousPath: string): string {
  const normalized = normalizePathString(previousPath);
  if (normalized === "/") {
    return "/";
  }

  const lastSlashIndex = normalized.lastIndexOf("/");
  if (lastSlashIndex <= 0) {
    return "/";
  }

  return normalized.slice(0, lastSlashIndex);
}

export type ResolveDirectoryPathResult =
  | { directory: Directory; path: string }
  | { error: string };

export function resolveDirectoryPath(
  pathInput: string,
  currentDir: Directory,
  rootDirectory: Directory,
  currentPath: string,
): ResolveDirectoryPathResult {
  const trimmedPath = pathInput.trim();
  if (!trimmedPath) {
    return { error: "path is empty" };
  }

  const isAbsolutePath = trimmedPath.startsWith("/");
  const segments = trimmedPath.split("/").filter(Boolean);

  let pointer = isAbsolutePath ? rootDirectory : currentDir;
  let resolvedPath = isAbsolutePath ? "/" : normalizePathString(currentPath);

  if (!segments.length) {
    return { directory: pointer, path: resolvedPath };
  }

  for (const segment of segments) {
    if (segment === ".") {
      continue;
    }

    if (segment === "..") {
      if (!pointer.parent) {
        return { error: "you're already at root" };
      }
      pointer = pointer.parent;
      resolvedPath = removePath(resolvedPath);
      continue;
    }

    const next = pointer.getChild(segment);
    if (next instanceof Directory) {
      pointer = next;
      resolvedPath = Path(rootDirectory, next, resolvedPath);
      continue;
    }

    return { error: `${segment} is not a directory` };
  }

  return { directory: pointer, path: resolvedPath };
}
