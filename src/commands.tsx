import createFile, { File, appendContentFunction, printContent } from "./file";
import createDirectory, { Directory } from "./directory"
import Path from "./path";
import { renderMarkdown, MarkdownImage, MarkdownSegment } from "./markdown";

export type CommandOutput = {
  text: string;
  images?: MarkdownImage[];
  segments?: MarkdownSegment[];
};

export function cat(file: File | any): CommandOutput {
  if (!(file instanceof File)) {
    var text = `Error: '${file}' is not a real file`;
    return { text };
  }
  const filePassed = file;
  const rawOutput = printContent(filePassed).trimStart();
  if (filePassed.format === "markdown") {
    const rendered = renderMarkdown(rawOutput);
    return { text: rendered.text, images: rendered.images, segments: rendered.segments };
  }
  return { text: rawOutput, segments: [{ type: "text", content: rawOutput }] };
}

export function mkdir(name: string, currentDir: Directory) {
  const newDirectory = createDirectory(name, currentDir);
  currentDir.appendElementDirectory(newDirectory);
  return "";
}

export function echo(content: string) {
  return content;
}

export function touch(name: string, currentDir: Directory): string {
  const newFile = createFile(name);
  currentDir.appendElementDirectory(newFile);
  return "";
}

export function ls(currentDirectory: Directory): Array<string> {
  var arrayReturnedNames = [];
  for (var value of currentDirectory.children.values()) {
    arrayReturnedNames.push(value.name);
  }
  return arrayReturnedNames;
}

export function greaterThan(file: File | any, content: string) {
  if (!(file instanceof File)) {
    var text = `Error : ${file} is not a real file`;
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
