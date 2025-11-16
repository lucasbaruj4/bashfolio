import { Directory } from "./directory";

export default function appendToPath(Root: Directory, currentDirectory: Directory, Path?: string): string | undefined {
  if (Path) {
    var path = Path;
  } else {
    var path = "";
  }
  var isRoot = false;
  for (var value of Root.list.values()) {
    if (value == Root.name) {
      path = Root.name + "/";
      isRoot = true;
      break;
    }
  }
  if (isRoot) {
    return path;
  } else if (!isRoot) {
    path += currentDirectory.name + "/";
    return path;
  }
}
