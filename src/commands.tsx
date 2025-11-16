import createFile, { File, appendContentFunction, printContent } from "./file";
import createDirectory, { Directory, appendFileToDirectory, appendDirectorytoDirectory } from "./directory"

export function cat(File: File) {
  const filePassed = File;
  const catOutput = printContent(filePassed);
  return catOutput;
}

export function mkdir(name: string) {
  const newDirectory = createDirectory(name);
  return newDirectory;
}

export function touch(name: string) {
  const newFile = createFile(name);
  return newFile;
}

export function greaterThan(file: File | any, content: string) {
  if (!(file instanceof File)) {
    var text = `File ${file}`;
    return text;
  }
  file.appendContent(content);
  return file;
}

