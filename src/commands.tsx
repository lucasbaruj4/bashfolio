import createFile, { File, appendContentFunction, printContent } from "./file";
import createDirectory, { Directory } from "./directory"

export function cat(file: File | any) {
  if (!(file instanceof File)) {
    var text = `Error: '${file}' is not a real file`;
    return text;
  }
  const filePassed = file;
  const catOutput = printContent(filePassed);
  return catOutput;
}

export function mkdir(name: string) {
  const newDirectory = createDirectory(name);
  return newDirectory;
}

export function echo(content: string) {
  return content;
}

export function touch(name: string) {
  const newFile = createFile(name);
  return newFile;
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

