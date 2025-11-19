'use client';
import CreateFile from "@src/file";
import { createElement } from "react";
import { appendContentFunction, } from "@src/file";
import { Directory, isDirectory } from "@src/directory";
import { File, isFile } from "@src/file";
import { useState, useRef } from "react";
import { cat, echo, ls, cd, mkdir, touch, greaterThan } from "@src/commands";
import Path from "@src/path";



var rootDirectory = new Directory("");
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
var rootPath = Path(rootDirectory, rootDirectory);
export default function terminal() {

  const currentPath = useRef(rootPath);
  const possibleGreaterThan = useRef(false);
  const [pastPrompts, setPrompts] = useState<Array<{
    cwd: string,
    output: string,
    textSent: string
  }>>([]);
  var commandSent = useRef(false);
  const [currentDir, setCurrentDir] = useState(rootDirectory);
  const [terminalText, setTerminalText] = useState("");
  const firstCommand = useRef("");
  const body = useRef("");
  var commandIdentified = useRef("");

  const detectKey = (e: any) => {
    var output: string;
    if (e.key == " " && !commandSent.current) { // FIRST SPACE PRESSED 
      commandSent.current = true; firstCommand.current = terminalText;
      detectCommand(firstCommand.current);
    } else if (e.key == " " && commandSent.current) {// SECOND SPACE PRESSED (possible greater than)
      possibleGreaterThan.current = true; // probably useless...
    } else if (e.key == 'Enter' && commandIdentified.current) { // ENTER WITH COMMAND IDENTIFIED
      // console.log(commandIdentified.current);
      commandSent.current = false;
      const to_substract: string = firstCommand.current + " ";
      const terminal: string = terminalText;
      body.current = (terminal.replace(to_substract, "")); // BODY IS WHAT'S WRITTEN AFTER THE FIRST COMMAND
      output = sendCommand(commandIdentified.current, body.current);
      if (commandIdentified.current == "clear") { //IF THE COMMAND WRITTEN IS CLEAR
        firstCommand.current = "";
        commandIdentified.current = "";
        body.current = "";
        setPrompts(old => [...old, { cwd: currentPath.current, output: "", textSent: terminalText }]);
        setTerminalText("");
        return;
      } else if ((body.current.includes(">"))) { // IF  THE BODY INCLUDES A GREATHER THAN SIGN
        var untouched_body = body.current;
        untouched_body = untouched_body.slice(untouched_body.indexOf(commandIdentified.current) + 1, untouched_body.indexOf(">"));
        untouched_body = untouched_body.trim();
        var extraOutput = sendCommand(commandIdentified.current, untouched_body);
        var afterBody = body.current.slice(body.current.indexOf(">") + 1);
        afterBody = afterBody.trim();
        var possible_file: any = isFile(afterBody, currentDir);
        if (possible_file instanceof File) { // IF THE BODY FOUND AFTER THE GREATER SIGN IS A FILE
          var greaterThanResult: File | string = greaterThan(possible_file, extraOutput);
          firstCommand.current = "";
          commandIdentified.current = "";
          body.current = "";
          setTerminalText("");
          setPrompts(old => [...old, { cwd: currentPath.current, output: "", textSent: terminalText }]);
        } else if (possible_file instanceof String) { // IF THE BODY FOUND AFTER THE GREATER SIGN IS A FILE
          firstCommand.current = "";
          commandIdentified.current = "";
          body.current = "";
          setTerminalText("");
          setPrompts(old => [...old, { cwd: currentPath.current, output: `Error : ${possible_file} is not a real file`, textSent: terminalText }]);
        }
      } else { // IF THE COMMAND WRITTEN IS NOT CLEAR, OR NOT GREATER THAN 
        firstCommand.current = "";
        commandIdentified.current = "";
        body.current = "";
        setPrompts(old => [...old, { cwd: currentPath.current, output: output, textSent: terminalText }]);
        setTerminalText("");
      }
    } else if (e.key == 'Enter' && commandSent.current && !commandIdentified.current) { // ENTER WITH A COMMAND SEND THAT HASN'T BEEN IDENTIFIED
      commandIdentified.current = "";
      firstCommand.current = "";
      setPrompts(old => [...old, { cwd: currentPath.current, output: `Error: command ${terminalText} not found`, textSent: terminalText }]);
      setTerminalText("");
      commandSent.current = false;
    } else if (e.key == 'Enter' && !commandSent.current) { // ENTER WITHOUT COMMAND SENT, MEANING ENTER WITHOUT HAVING PRESSED SPACE FIRST
      if (terminalText == "clear") { // SPECIAL CASE FOR CLEAR
        setTerminalText("");
        setPrompts([]);
        commandIdentified.current = "";
        commandSent.current = false;
        firstCommand.current = "";
      } else {
        const detect_verdict = detectCommand(terminalText); // IF IT RETURNS TRUE, IT'S A COMMAND THAT CAN RUN WITHOUT ARGUMENTS 
        if (detect_verdict) {
          var fake_body = "";
          // console.log("sending to send command", terminalText, fake_body);
          const output = sendCommand(terminalText, fake_body);
          setTerminalText("");
          commandIdentified.current = "";
          firstCommand.current = "";
          setPrompts(old => [...old, { cwd: currentPath.current, output: output, textSent: terminalText }]);
          // console.log("states after sending ls", "command Identified: ", commandIdentified.current, "commandSent = ", commandSent.current);
          commandSent.current = false;
        } else if (!detect_verdict) { // IF IT RETURNS FALSE IT'S JUST A BAD COMMAND
          commandIdentified.current = "";
          firstCommand.current = "";
          setPrompts(old => [...old, { cwd: currentPath.current, output: `Error: command ${terminalText} hasn't received an argument`, textSent: terminalText }]);
          setTerminalText("");
          commandSent.current = false;
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
        const output_isDirectory = isDirectory(body, currentDir);
        var output_cd: Map<string, Directory | string>;
        var newPath: any;
        var newDirectory: any;
        if (output_isDirectory instanceof Directory) {
          output_cd = cd(output_isDirectory, rootDirectory, currentPath.current);
          newPath = output_cd.get("newPath");
          newDirectory = output_cd.get("newDirectory");
          currentPath.current = newPath;
          setCurrentDir(newDirectory);
        } else {
          output = `Error: ${body} is not a directory`;
        }
        break;
      case "mkdir":
        output = mkdir(body, currentDir);
        break;
      case "rmdir":
        break;
      case "clear":
        break;
      case "echo":
        output = echo(body);
        break;
      case "touch":
        output = touch(body, currentDir);
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
        return false;
      case "ls":
        commandIdentified.current = firstCommand;
        return true;
      case "cd":
        commandIdentified.current = firstCommand;
        return false;
      case "mkdir":
        commandIdentified.current = firstCommand;
        return false;
      case "rmdir":
        commandIdentified.current = firstCommand;
        return false;
      case "echo":
        commandIdentified.current = firstCommand;
        return false;
      case "clear":
        commandIdentified.current = firstCommand;
        break;
      case "touch":
        commandIdentified.current = firstCommand;
        return false;
      default:
        console.log("No Commands Detected");
        commandIdentified.current = "";
        break;
    }
  }

  function createCurrentPrompt({ cwd, output }: { cwd: string, output: string }) {
    return (
      <div onKeyDown={detectKey}>
        <div id="current_prompt" className="container grid grid-cols-[auto_1fr] gap-1 text-white p-3 text-xl py-5">
          <div id="current_pwd" className="col-start-1 text-left text-3xl font-[Terminal]">
            {cwd} {">"}&nbsp;
          </div>
          <input id="current_user_prompt" value={terminalText} placeholder="try 'cat README'" autoFocus type="text" className="col-start-2 text-left text-3xl font-[Terminal] outline-none  caret_transparent" onChange={(e) => setTerminalText(e.target.value)} />
        </div>
        <div id="current_output_div" className="text-3xl font-[Terminal]"> {output} </div>
      </div>
    )
  }

  function createPastPrompt({ cwd, output, textSent }: { cwd: string, output: string, textSent: string }) {
    return (
      <div>
        <div id="prompt" className="container grid grid-cols-[auto_1fr] gap-1 text-white p-3 text-xl py-5">
          <div id="pwd" className="col-start-1 text-left text-3xl font-[Terminal]">
            {cwd} {">"}&nbsp;
          </div>
          <div id="user_prompt" className="col-start-2 text-left text-3xl font-[Terminal] outline-none  caret_transparent">{textSent}</div>
        </div>
        <div id="output_div" className="text-3xl font-[Terminal]"> {output} </div>
      </div>
    )
  }

  function cleanTerminal(e: any) {
    // console.log("change on pastprompts div, must clean terminal text");
    setTerminalText("");
  }

  return (
    <div >
      {pastPrompts.map(
        (eachPromptValues, i) =>
          <div key={i} onChange={cleanTerminal}>
            {createPastPrompt(eachPromptValues)}
          </div>)}

      {createCurrentPrompt({ cwd: currentPath.current, output: "" })}
    </div>
  )
}
