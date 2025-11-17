import { File } from "./file";

export class Directory {
  name: string;
  inode: number;
  list: Map<number, File | Directory>;
  isDirectory: boolean = true;

  constructor(name: string) {
    this.name = name + "/";
    this.inode = Math.floor(Math.random() * 10000);
    this.list = new Map();
  }

  appendElementDirectory(inode: number, Element: File | Directory) {
    this.list.set(inode, Element);
  }


}

export default function createDirectory(name: string) {
  const newDirectory = new Directory(name);
  return newDirectory;
}



