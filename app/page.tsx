'use client';
import CreateFile from "@src/file";
import { createElement, useEffect } from "react";
import { appendContentFunction, } from "@src/file";
import { Directory, isDirectory } from "@src/directory";
import { File, isFile } from "@src/file";
import { useState, useRef } from "react";
import { cat, echo, ls, cd, mkdir, touch, greaterThan } from "@src/commands";
import Path, { removePath } from "@src/path";



var rootDirectory = new Directory("");
function initializeRootDirectory(rootDirectory: Directory): void {
  var README = new File("README");
  README.appendContent("Hi!, My name is Lucas, I'm a developer with experience writing Python, JavaScript/TypeScript and C. I'm currently based in Berlin, Germany and I'm looking for an internship.\n My Developer style is honestly all over the place, I follow my own curiosity and passion, that's why I try to work only on things I find interesting.\n If you'd like to know more about what I do, check my github =>\n  https://github.com/lucasbaruj4 \n and also follow me on X =>\n https://x.com/baruthedev \n If you'd like to know more about how to use this project, which is called 'bashfolio', please cat the 'how_to' file in this directory.");
  var Berlin = new File("berlin_2025");
  Berlin.appendContent(`As of October 2025 I'm living in Berlin, Germany because of an exchange program with my Home University back at Paraguay.
		       The city is cold, very cold, I'm gonna see the snow for the first time!, Germans are considered rude by some people but I think they're just missunderstood, I appreciate their idea of politeness = just don't bother anyone!. You get used to this city, and I rarely find myself missing home, I just hope I can work in something I enjoy here.`);
  var How_To = new File("how_to");
  How_To.appendContent(`This is Bashfolio, a pseudo terminal that "runs" bash, these are the commands that are current functional:\t
			- cd (This command works for going into directories and you can go back to the father directory using 'cd ..')\t
  			- ls (This command lets you list all files/directories in the current directory)\t
  			- mkdir (This command lets you create a new directory named whatever you put as an argument)\t
  			- touch (This command lets you create a new file in the current directory named whatever you put as an argument)\t
  			- > (This command is the only way you can append content to a file, it takes the output of the previous command you used and then put it on the file you want to append the content to)\t
			- echo (This command works for printing a string that you pass as an argument after the command)\t
			More commands are coming depending on my free time! If you'd like to contribute to this project please write me an email to barujalucas0@gmail.com, if enough people contact me I'll make this pseudo terminal open source. Have fun! `);
  rootDirectory.appendElementDirectory(README.inode, README);
  rootDirectory.appendElementDirectory(Berlin.inode, Berlin);
  rootDirectory.appendElementDirectory(How_To.inode, How_To);
}

initializeRootDirectory(rootDirectory);
var rootPath = Path(rootDirectory, rootDirectory);
export default function terminal() {

  const currentPath = useRef(rootPath);
  const inputFocus = useRef<HTMLInputElement>(null);
  const showReadmePlaceHolder = useRef(true);
  const possibleGreaterThan = useRef(false);
  const fatherDirectory = useRef(rootDirectory);
  const positionLog = useRef(new Map());
  const [pastPrompts, setPrompts] = useState<Array<{
    cwd: string,
    output: string,
    textSent: string
  }>>([]);
  var commandSent = useRef(false);
  const currentDir = useRef(rootDirectory);
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
      } else if (commandIdentified.current == "cd") { //IF THE COMMAND WRITTEN IS CD  
        if (body.current.includes("..")) { // IF THE BODY IS ".."
          firstCommand.current = "";
          commandIdentified.current = "";
          body.current = "";
          setPrompts(old => [...old, { cwd: currentPath.current, output: output, textSent: terminalText }]);
          setTerminalText("");
        } else {
          firstCommand.current = "";
          commandIdentified.current = "";
          body.current = "";
          setPrompts(old => [...old, { cwd: currentPath.current, output: output, textSent: terminalText }]);
          setTerminalText("");
        }
      } else if ((body.current.includes(">"))) { // IF  THE BODY INCLUDES A GREATHER THAN SIGN
        var untouched_body = body.current;
        untouched_body = untouched_body.slice(untouched_body.indexOf(commandIdentified.current) + 1, untouched_body.indexOf(">"));
        untouched_body = untouched_body.trim();
        var extraOutput = sendCommand(commandIdentified.current, untouched_body);
        var afterBody = body.current.slice(body.current.indexOf(">") + 1);
        afterBody = afterBody.trim();
        var possible_file: any = isFile(afterBody, currentDir.current);
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
      } else if (commandIdentified.current == "cat" && body.current.includes("README")) { // IF THE COMMAND IS CAT README ON ROOT
        if (currentDir.current.name == "/") {
          showReadmePlaceHolder.current = false;
          firstCommand.current = "";
          commandIdentified.current = "";
          body.current = "";
          setTerminalText("");
          setPrompts(old => [...old, { cwd: currentPath.current, output: output, textSent: terminalText }]);
        }
      }
      else { // IF THE COMMAND WRITTEN IS NOT CLEAR, OR NOT GREATER THAN 
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
        output = cat(isFile(body, currentDir.current));
        break;
      case "ls":
        output = ls(currentDir.current);
        var copyOutput = output;
        output = "";
        for (var value of copyOutput) {
          output += value + "  ";
        }
        break;
      case "cd":
        var output_cd: Map<string, Directory | string>;
        var newPath: any;
        var newDirectory: any;
        if (body == "..") {
          if (currentDir.current.name == "/") {
            positionLog.current.clear();
            output = `Error: you're already at root`;
          } else {
            output_cd = cd(fatherDirectory.current, rootDirectory, currentPath.current);
            newPath = removePath(currentPath.current);
            newDirectory = output_cd.get("newDirectory");
            currentPath.current = newPath;
            if (currentDir.current == fatherDirectory.current) { // THIS MEANS WE KNOW WE HAVE TO GO ONE "CHANGE" BEFORE 
              var beforeFather;
              for (const [key, value] of positionLog.current) {
                if (value == currentDir.current) {
                  beforeFather = key;
                }
              }
              currentDir.current = beforeFather;
            } else {
              currentDir.current = fatherDirectory.current;
            }
          }
        } else {
          const output_isDirectory = isDirectory(body, currentDir.current);
          if (output_isDirectory instanceof Directory) {
            output_cd = cd(output_isDirectory, rootDirectory, currentPath.current);
            newPath = output_cd.get("newPath");
            newDirectory = output_cd.get("newDirectory");
            currentPath.current = newPath;
            fatherDirectory.current = currentDir.current;
            positionLog.current.set(currentDir.current, newDirectory);
            currentDir.current = newDirectory;
          } else {
            output = `Error: ${body} is not a directory`;
          }
        }
        break;
      case "mkdir":
        output = mkdir(body, currentDir.current);
        break;
      case "rmdir":
        break;
      case "clear":
        break;
      case "echo":
        output = echo(body);
        break;
      case "touch":
        output = touch(body, currentDir.current);
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

  function createCurrentPrompt({ cwd, output }: { cwd: string, output: string }, showReadmePlaceHolder?: boolean) {
    var placeholder = 'write "cat README"';

    if (!showReadmePlaceHolder || currentDir.current.name != "/") {
      placeholder = '';
    }

    return (
      <div onKeyDown={detectKey}>
        <div id="current_prompt" className="container grid grid-cols-[auto_1fr] gap-1 text-white p-3 text-xl py-5">
          <div id="current_pwd" className="col-start-1 text-left text-3xl font-[Terminal]">
            {cwd} {">"}&nbsp;
          </div>
          <input id="current_user_prompt" value={terminalText} placeholder={placeholder} autoFocus ref={inputFocus} type="text" className="col-start-2 text-left text-3xl font-[Terminal] outline-none  caret_transparent" onChange={(e) => setTerminalText(e.target.value)} />
        </div>
        <div id="current_output_div" className="text-3xl font-[Terminal]"> {output} </div>
      </div>
    )
  }

  useEffect(() => {
    inputFocus.current?.focus();
  }, []);


  function createPastPrompt({ cwd, output, textSent }: { cwd: string, output: string, textSent: string }) {
    return (
      <div>
        <div id="prompt" className="container grid grid-cols-[auto_1fr] gap-1 text-white p-3 text-xl py-5">
          <div id="pwd" className="col-start-1 text-left text-3xl font-[Terminal]">
            {cwd} {">"}&nbsp;
          </div>
          <div id="user_prompt" className="col-start-2 text-left text-3xl font-[Terminal] outline-none  caret_transparent">{textSent}</div>
        </div>
        <div id="output_div"  className="whitespace-pre-wrap text-3xl font-[Terminal]"> {output} </div>
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

      {createCurrentPrompt({ cwd: currentPath.current, output: "" }, showReadmePlaceHolder.current)}
    </div>
  )
}
