import { File } from "./file";

export class Directory {
  name: string;
  inode: number;
  children: Map<string, File | Directory>;
  parent: Directory | null;
  isDirectory: boolean = true;

  constructor(name: string, parent: Directory | null = null) {
    this.name = name
      ? (name.endsWith("/") ? name : `${name}/`)
      : "/";
    this.parent = parent;
    this.inode = Math.floor(Math.random() * 10000);
    this.children = new Map();
  }

  appendElementDirectory(element: File | Directory) {
    if (element instanceof Directory) {
      element.parent = this;
    }
    this.children.set(element.name, element);
  }

  getChild(name: string) {
    const direct = this.children.get(name);
    if (direct || name.endsWith("/")) {
      return direct;
    }
    return this.children.get(`${name}/`);
  }
}

export default function createDirectory(name: string, parent: Directory | null = null) {
  const newDirectory = new Directory(name, parent);
  return newDirectory;
}

export function isDirectory(possibleDirectory: string, currentDirectory: Directory): Directory | string {
  const child = currentDirectory.getChild(possibleDirectory);
  if (child instanceof Directory) {
    return child;
  }
  return possibleDirectory;
}
