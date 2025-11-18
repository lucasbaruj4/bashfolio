import { Directory } from "./directory";

export default function Path(rootDirectory: Directory, currentDir: Directory, previousPath?: string): string {
  var pathString: string;
  if (rootDirectory.name == currentDir.name) {
    return rootDirectory.name;
  } else if (previousPath) {
    previousPath += currentDir.name;
    return previousPath;
  } else if (currentDir) {
    pathString = rootDirectory.name + currentDir.name;
    return pathString;
  }
  return "Path not found";
}
