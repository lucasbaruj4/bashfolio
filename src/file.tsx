class File {
  name: string;
  content?: string;

  constructor(name: string, content?: string) {
    this.name = name;
    this.content = content;
  }

  appendContent(content: string) {
    this.content = content;
  }
}


export default function CreateFile(name: string) {
  var newFile: File = new File(name);
  console.log("The file has been created");
  return newFile;
}

export function appendContent(file: File, content: string) {
  file.appendContent(content);
  console.log("The content has been appended to the file");
  return file;
}



