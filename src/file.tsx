import { Directory } from "./directory";

export class File {
  name: string;
  contentArray: string[];
  content?: string;
  inode: number;
  isDirectory: boolean = false;

  constructor(name: string) {
    this.name = name;
    this.inode = Math.floor(Math.random() * 10000);
    this.contentArray = [];
  }

  appendContent(content: string) {
    this.contentArray!.push(content);
  }
}


export default function createFile(name: string) {
  var newFile: File = new File(name);
  return newFile;
}

export function appendContentFunction(file: File, content: string) {
  file.appendContent(content);
  return file;
}


export function printContent(file: File) {
  const arrayContent = file.contentArray;
  var text = " ";
  for (var item of arrayContent) {
    text += item;
  }
  return text;
}

export function isFile(possibleFile: string, currentDirectory: Directory): File | string {
  for (var value of currentDirectory.list.values()) {
    if (value instanceof File && value.name == possibleFile) {
      return value;
    }
  }
  return possibleFile;
}


