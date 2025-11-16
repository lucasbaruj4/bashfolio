import { File } from "./file";

export class Directory {
  name: string;
  inode: number;
  list: Map<number, string>;
  isDirectory: boolean = true;

  constructor(name: string) {
    this.name = name;
    this.inode = Math.floor(Math.random() * 10000);
    this.list = new Map();
  }

  appendElementDirectory(inode: number, name: string) {
    this.list.set(inode, name);
  }


}

export default function createDirectory(name: string) {
  const newDirectory = new Directory(name);
  return newDirectory;
}

export function appendFileToDirectory(File: File, Directory: Directory) {
  Directory.appendElementDirectory(File.inode, File.name);
}

export function appendDirectorytoDirectory(Directory: Directory) {
  Directory.appendElementDirectory(Directory.inode, Directory.name);
}


