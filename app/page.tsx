'use client';
import CreateFile from "@src/file";
import { appendContentFunction, } from "@src/file";
import { Directory } from "@src/directory";
import { File, isFile } from "@src/file";
import { useState, useRef } from "react";
import { cat, echo, ls, mkdir, touch, greaterThan } from "@src/commands";

var rootDirectory = new Directory("/");
function initializeRootDirectory(rootDirectory: Directory): void {
  var README = new File("README");
  README.appendContent("hola me llamo lucas este es mi README bla bla bla");
  var Berlin = new File("berlin_2025");
  Berlin.appendContent("vivo en Berlin 2025");
  var Future_Plans = new File("future_plans");
  Future_Plans.appendContent("mis planes para el futuro son blnnfasdnasd");
  rootDirectory.appendElementDirectory(README.inode, README);
  rootDirectory.appendElementDirectory(Berlin.inode, Berlin);
  rootDirectory.appendElementDirectory(Future_Plans.inode, Future_Plans);
}

initializeRootDirectory(rootDirectory);
export default function terminal() {
  var commandSent = useRef(false);
  const [currentDir, setCurrentDir] = useState(rootDirectory);
  const [terminalText, setTerminalText] = useState("");
  const firstCommand = useRef("");
  const body = useRef("");
  var commandIdentified = useRef(" ");

  const detectKey = (e: any) => {
    var output: string;
    if (e.key == " " && !commandSent.current) {
      commandSent.current = true;
      firstCommand.current = terminalText;
      detectCommand(firstCommand.current);
    } else if (e.key == 'Enter' && commandIdentified.current != " ") {
      console.log(commandIdentified.current);
      commandSent.current = false;
      const to_substract: string = firstCommand.current + " ";
      const terminal: string = terminalText;
      body.current = (terminal.replace(to_substract, ""));
      output = sendCommand(commandIdentified.current, body.current);
      setTerminalText("");
      if (commandIdentified.current == "clear") {
        firstCommand.current = " ";
        commandIdentified.current = " ";
        body.current = "";
        return;
      }
      const output_div = document.getElementById("output_div") as HTMLElement;
      output_div.innerHTML = output;
      firstCommand.current = " ";
      commandIdentified.current = " ";
      body.current = "";
    } else if (e.key == 'Enter' && commandSent.current && commandIdentified.current == " ") {
      console.log("puerkesa de comando")
      const output_div = document.getElementById("output_div") as HTMLElement;
      output_div.innerHTML = `Error: command ${terminalText} not found`;
      setTerminalText("");
      commandIdentified.current = " ";
      firstCommand.current = " ";
    } else if (e.key == 'Enter' && !commandSent.current) {
      if (terminalText == "clear") {
        setTerminalText(" ");
        window.location.reload();
      } else {
        const detect_verdict = detectCommand(terminalText);
        if (detect_verdict == true) {
          var fake_body = "";
          const output = sendCommand(terminalText, fake_body);
          const output_div = document.getElementById("output_div") as HTMLElement;
          output_div.innerHTML = output;
        } else {
          const output_div = document.getElementById("output_div") as HTMLElement;
          output_div.innerHTML = `Error: command ${terminalText} not found`;
          setTerminalText("");
          commandIdentified.current = " ";
          firstCommand.current = " ";
        }
      }
    }
  }

  const sendCommand = (command: string, body: string): any => {
    var output;
    switch (command) {
      case "cat":
        output = cat(isFile(body, currentDir));
        break;
      case "ls":
        output = ls(currentDir);
        var copyOutput = output;
        output = "";
        for (var value of copyOutput) {
          output += value + "  ";
        }
        break;
      case "cd":
        break;
      case "mkdir":
        break;
      case "rmdir":
        break;
      case "clear":
        window.location.reload();
        break;
      case "echo":
        output = echo(body);
        break;
      default:
        console.log("The command in the argument of sendCommand hasn't been interpreted");
        break;
    }
    return output;
  }

  const detectCommand = (firstCommand: string): void | boolean => {
    console.log("el comando es: ", firstCommand);
    switch (firstCommand) {
      case "cat":
        commandIdentified.current = firstCommand;
        break;
      case "ls":
        commandIdentified.current = firstCommand;
        return true;
      case "cd":
        commandIdentified.current = firstCommand;
        break;
      case "mkdir":
        commandIdentified.current = firstCommand;
        break;
      case "rmdir":
        commandIdentified.current = firstCommand;
        break;
      case "echo":
        commandIdentified.current = firstCommand;
        break;
      case "clear":
        commandIdentified.current = firstCommand;
        break;
      default:
        console.log("No Commands Detected");
        commandIdentified.current = " ";
        break;
    }
  }

  return (
    <div onKeyDown={detectKey}>
      <div id="prompt" className="container grid grid-cols-[auto_1fr] gap-1 text-white p-3 text-xl py-5">
        <div id="pwd" className="col-start-1 text-left text-3xl font-[Terminal]">
          ~/some/direction {">"}&nbsp;
        </div>
        <input id="user_prompt" value={terminalText} placeholder="try 'cat README'" autoFocus type="text" className="col-start-2 text-left text-3xl font-[Terminal] outline-none  caret_transparent" onChange={(e) => setTerminalText(e.target.value)} />
      </div>
      <div id="output_div" className="text-3xl font-[Terminal]"></div>
    </div>
  )
}
