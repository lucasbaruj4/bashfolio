import createFile, { File, appendContentFunction, printContent } from "./file";
import createDirectory, { Directory } from "./directory"
import Path from "./path";

export function cat(file: File | any) {
  if (!(file instanceof File)) {
    var text = `Error: '${file}' is not a real file`;
    return text;
  }
  const filePassed = file;
  const catOutput = printContent(filePassed);
  return catOutput;
}

export function mkdir(name: string, currentDir: Directory) {
  const newDirectory = createDirectory(name);
  currentDir.appendElementDirectory(newDirectory.inode, newDirectory);
  return "";
}

export function echo(content: string) {
  return content;
}

export function touch(name: string, currentDir: Directory): string {
  const newFile = createFile(name);
  currentDir.appendElementDirectory(newFile.inode, newFile);
  return "";
}

export function ls(currentDirectory: Directory): Array<string> {
  var arrayReturnedNames = [];
  for (var value of currentDirectory.list.values()) {
    arrayReturnedNames.push(value.name);
  }
  return arrayReturnedNames;
}

export function greaterThan(file: File | any, content: string) {
  if (!(file instanceof File)) {
    var text = `File ${file}`;
    return text;
  }
  file.appendContent(content);
  return file;
}

export function cd(cdingInto: Directory, rootDirectory: Directory, previousPath: string): Map<string, Directory | string> {
  var newPath = Path(rootDirectory, cdingInto, previousPath);
  var outputMap = new Map();
  outputMap.set("newPath", newPath);
  outputMap.set("newDirectory", cdingInto)
  return outputMap;

}
