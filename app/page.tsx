'use client';
import { useEffect, useState, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Directory, isDirectory } from "@src/directory";
import { File, isFile } from "@src/file";
import { cat, echo, ls, cd, mkdir, touch, greaterThan, CommandOutput } from "@src/commands";
import Path, { removePath } from "@src/path";
import TerminalOutput from "@src/terminal-output";
import { parseCommand, type ParsedCommand } from "@src/parser";



const SUPPORTED_COMMANDS = new Set(["cat", "ls", "cd", "mkdir", "rmdir", "echo", "touch", "clear"]);
const COMMANDS_REQUIRING_ARGS = new Set(["cat", "cd", "mkdir", "rmdir", "echo", "touch"]);

const readmeFile = new File("README", "markdown");
var rootDirectory = new Directory("");
function initializeRootDirectory(rootDirectory: Directory): void {
  readmeFile.appendContent("README is loading...");
  rootDirectory.appendElementDirectory(readmeFile.inode, readmeFile);
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
  rootDirectory.appendElementDirectory(Berlin.inode, Berlin);
  rootDirectory.appendElementDirectory(How_To.inode, How_To);
}

initializeRootDirectory(rootDirectory);
var rootPath = Path(rootDirectory, rootDirectory);
export default function terminal() {

  const currentPath = useRef(rootPath);
  const inputFocus = useRef<HTMLInputElement>(null);
  const showReadmePlaceHolder = useRef(true);
  const fatherDirectory = useRef(rootDirectory);
  const positionLog = useRef(new Map());
  const commandHistory = useRef<Array<string>>([]);
  const historyIndex = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [pastPrompts, setPrompts] = useState<Array<{
    cwd: string,
    output: CommandOutput,
    textSent: string
  }>>([]);
  const currentDir = useRef(rootDirectory);
  const [terminalText, setTerminalText] = useState("");
  const logPrompt = (output: CommandOutput, textSent: string) => {
    setPrompts(old => [...old, { cwd: currentPath.current, output, textSent }]);
  };

  const recordCommandHistory = (rawInput: string) => {
    commandHistory.current.push(rawInput);
    historyIndex.current = null;
  };

  const processCurrentInput = () => {
    const rawInput = terminalText;
    if (!rawInput.trim()) {
      setTerminalText("");
      return;
    }

    const parsedResult = parseCommand(rawInput);
    if (parsedResult.error) {
      if (parsedResult.error === "No command provided") {
        setTerminalText("");
        return;
      }
      logPrompt({ text: `Error: ${parsedResult.error}` }, rawInput);
      setTerminalText("");
      return;
    }

    recordCommandHistory(rawInput);
    runCommand(parsedResult.command, rawInput);
  };

  const handleHistoryNavigation = (direction: "up" | "down") => {
    const history = commandHistory.current;
    if (!history.length) {
      return;
    }

    if (direction === "up") {
      const nextIndex = historyIndex.current === null
        ? history.length - 1
        : Math.max(0, historyIndex.current - 1);
      historyIndex.current = nextIndex;
      setTerminalText(history[nextIndex]);
      return;
    }

    if (historyIndex.current === null) {
      return;
    }

    if (historyIndex.current >= history.length - 1) {
      historyIndex.current = null;
      setTerminalText("");
      return;
    }

    const nextIndex = historyIndex.current + 1;
    historyIndex.current = nextIndex;
    setTerminalText(history[nextIndex]);
  };

  const handleCtrlC = () => {
    logPrompt({ text: "^C" }, terminalText);
    setTerminalText("");
    historyIndex.current = null;
  };

  const handleInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      processCurrentInput();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      handleHistoryNavigation("up");
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      handleHistoryNavigation("down");
      return;
    }

    if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      handleCtrlC();
    }
  };

  const handleInputChange = (value: string) => {
    setTerminalText(value);
    historyIndex.current = null;
  };

  const runCommand = (command: ParsedCommand, rawInput: string) => {
    if (command.name === "clear") {
      setTerminalText("");
      setPrompts([]);
      return;
    }

    if (!SUPPORTED_COMMANDS.has(command.name)) {
      logPrompt({ text: `Error: command ${command.name} not found` }, rawInput);
      setTerminalText("");
      return;
    }

    if (COMMANDS_REQUIRING_ARGS.has(command.name) && command.args.length === 0) {
      logPrompt({ text: `Error: command ${command.name} hasn't received an argument` }, rawInput);
      setTerminalText("");
      return;
    }

    const output = sendCommand(command);

    if (
      command.name === "cat" &&
      !command.redirectTarget &&
      command.args.some((arg) => arg === "README") &&
      currentDir.current.name == "/"
    ) {
      showReadmePlaceHolder.current = false;
    }

    logPrompt(output, rawInput);
    setTerminalText("");
  };

  const sendCommand = (command: ParsedCommand): CommandOutput => {
    const body = command.args.join(" ");
    let output: CommandOutput = { text: "" };

    switch (command.name) {
      case "cat":
        output = cat(isFile(body, currentDir.current));
        break;
      case "ls":
        var listOutput = ls(currentDir.current);
        var formattedOutput = "";
        for (var value of listOutput) {
          formattedOutput += value + "  ";
        }
        output = { text: formattedOutput };
        break;
      case "cd":
        var output_cd: Map<string, Directory | string>;
        var newPath: any;
        var newDirectory: any;
        var cdText = "";
        if (body == "..") {
          if (currentDir.current.name == "/") {
            positionLog.current.clear();
            cdText = `Error: you're already at root`;
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
            cdText = `Error: ${body} is not a directory`;
          }
        }
        output = { text: cdText };
        break;
      case "mkdir":
        mkdir(body, currentDir.current);
        output = { text: "" };
        break;
      case "rmdir":
        output = { text: `Error: rmdir not implemented` };
        break;
      case "clear":
        output = { text: "" };
        break;
      case "echo":
        output = { text: echo(body) };
        break;
      case "touch":
        touch(body, currentDir.current);
        output = { text: "" };
        break;
      default:
        console.log("The command in the argument of sendCommand hasn't been interpreted");
        output = { text: "" };
        break;
    }

    if (command.redirectTarget) {
      const possibleFile = isFile(command.redirectTarget, currentDir.current);
      if (possibleFile instanceof File) {
        greaterThan(possibleFile, output.text ?? "");
        return { text: "" };
      }
      return { text: `Error : ${command.redirectTarget} is not a real file` };
    }

    return output;
  };

  function createCurrentPrompt({ cwd, output }: { cwd: string, output: string }, showReadmePlaceHolder?: boolean) {
    var placeholder = 'write "cat README"';

    if (!showReadmePlaceHolder || currentDir.current.name != "/") {
      placeholder = '';
    }

    return (
      <div>
        <div id="current_prompt" className="container grid grid-cols-[auto_1fr] gap-1 text-white p-3 text-xl py-5">
          <div id="current_pwd" className="col-start-1 text-left text-3xl font-[Terminal]">
            {cwd} {">"}&nbsp;
          </div>
          <input
            id="current_user_prompt"
            value={terminalText}
            placeholder={placeholder}
            autoFocus
            ref={inputFocus}
            type="text"
            className="col-start-2 text-left text-3xl font-[Terminal] outline-none  caret_transparent"
            onKeyDown={handleInputKeyDown}
            onChange={(e) => handleInputChange(e.target.value)}
          />
        </div>
        <div id="current_output_div" className="text-3xl font-[Terminal]"> {output} </div>
      </div>
    )
  }

  useEffect(() => {
    const loadReadme = async () => {
      try {
        const response = await fetch("/content/README.md");
        if (!response.ok) {
          throw new Error(`status ${response.status}`);
        }
        const markdown = await response.text();
        readmeFile.contentArray.splice(0, readmeFile.contentArray.length);
        readmeFile.appendContent(markdown);
      } catch (error) {
        readmeFile.contentArray.splice(0, readmeFile.contentArray.length);
        const message = error instanceof Error ? error.message : "unknown error";
        readmeFile.appendContent(`Failed to load README: ${message}`);
      }
    };
    loadReadme();
  }, []);

  useEffect(() => {
    inputFocus.current?.focus();
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pastPrompts]);


  function createPastPrompt({ cwd, output, textSent }: { cwd: string, output: CommandOutput, textSent: string }) {
    return (
      <div>
        <div id="prompt" className="container grid grid-cols-[auto_1fr] gap-1 text-white p-3 text-xl py-5">
          <div id="pwd" className="col-start-1 text-left text-3xl font-[Terminal]">
            {cwd} {">"}&nbsp;
          </div>
          <div id="user_prompt" className="col-start-2 text-left text-3xl font-[Terminal] outline-none  caret_transparent">{textSent}</div>
        </div>
        <TerminalOutput output={output} />
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
      <div ref={bottomRef} />
    </div>
  )
}
