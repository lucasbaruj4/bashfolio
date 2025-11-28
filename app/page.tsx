'use client';
import { useEffect, useState, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Directory } from "@src/directory";
import { File, isFile } from "@src/file";
import { cat, echo, ls, mkdir, touch, greaterThan, CommandOutput } from "@src/commands";
import Path, { resolveDirectoryPath } from "@src/path";
import TerminalOutput from "@src/terminal-output";
import { parseCommand, type ParsedCommand } from "@src/parser";



const SUPPORTED_COMMANDS = new Set(["cat", "ls", "cd", "mkdir", "rmdir", "echo", "touch", "clear", "help"]);
const COMMANDS_REQUIRING_ARGS = new Set(["cat", "cd", "mkdir", "rmdir", "echo", "touch"]);

const readmeFile = new File("README", "markdown");
const berlinFile = new File("berlin_2025", "markdown");
const howToFile = new File("how_to", "markdown");

const MARKDOWN_SOURCES = [
  { file: readmeFile, url: "/content/README.md", label: "README" },
  { file: berlinFile, url: "/content/berlin_2025.md", label: "berlin_2025" },
  { file: howToFile, url: "/content/how_to.md", label: "how_to" },
] as const;

MARKDOWN_SOURCES.forEach(({ file, label }) => {
  file.appendContent(`${label} is loading...`);
});

var rootDirectory = new Directory("");
function initializeRootDirectory(rootDirectory: Directory): void {
  MARKDOWN_SOURCES.forEach(({ file }) => {
    rootDirectory.appendElementDirectory(file);
  });
}

initializeRootDirectory(rootDirectory);
var rootPath = Path(rootDirectory, rootDirectory);
export default function terminal() {

  const currentPath = useRef(rootPath);
  const inputFocus = useRef<HTMLInputElement>(null);
  const showReadmePlaceHolder = useRef(true);
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
  const [completionOptions, setCompletionOptions] = useState<string[]>([]);
  const logPrompt = (output: CommandOutput, textSent: string) => {
    setPrompts(old => [...old, { cwd: currentPath.current, output, textSent }]);
  };

  const recordCommandHistory = (rawInput: string) => {
    commandHistory.current.push(rawInput);
    historyIndex.current = null;
    setCompletionOptions([]);
  };

  const processCurrentInput = () => {
    const rawInput = terminalText;
    if (!rawInput.trim()) {
      setTerminalText("");
      setCompletionOptions([]);
      return;
    }

    const parsedResult = parseCommand(rawInput);
    if (parsedResult.error) {
      if (parsedResult.error === "No command provided") {
        setTerminalText("");
        setCompletionOptions([]);
        return;
      }
      logPrompt({ text: `Error: ${parsedResult.error}` }, rawInput);
      setTerminalText("");
      setCompletionOptions([]);
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
    setCompletionOptions([]);
  };

  const directoryEntries = () => {
    const entries: Array<{ name: string; isDirectory: boolean }> = [];
    currentDir.current.children.forEach((value) => {
      if (value instanceof Directory) {
        const normalized = value.name.endsWith("/") ? value.name.slice(0, -1) : value.name;
        entries.push({ name: normalized, isDirectory: true });
      } else {
        entries.push({ name: value.name, isDirectory: false });
      }
    });
    return entries.sort((a, b) => a.name.localeCompare(b.name));
  };

  const findCommonPrefix = (options: string[]): string => {
    if (!options.length) {
      return "";
    }
    let prefix = options[0];
    for (let i = 1; i < options.length; i += 1) {
      while (!options[i].startsWith(prefix) && prefix) {
        prefix = prefix.slice(0, -1);
      }
      if (!prefix) {
        break;
      }
    }
    return prefix;
  };

  const handleAutocomplete = () => {
    if (!terminalText.trim()) {
      setCompletionOptions([]);
      return;
    }

    const cursorIndex = terminalText.length;
    const textBeforeCursor = terminalText.slice(0, cursorIndex);
    const match = textBeforeCursor.match(/(^|\s)([^\s]*)$/);
    const rawPrefix = match ? match[2] : "";
    const prefixStart = match ? cursorIndex - rawPrefix.length : cursorIndex;
    const baseText = terminalText.slice(0, prefixStart);
    const suffixText = terminalText.slice(cursorIndex);

    let prefix = rawPrefix;
    let quotePrefix = "";

    if (prefix.startsWith("\"") || prefix.startsWith("'")) {
      quotePrefix = prefix[0];
      prefix = prefix.slice(1);
    }

    if (!prefix) {
      setCompletionOptions([]);
      return;
    }

    if (prefix.includes("/")) {
      setCompletionOptions([]);
      return;
    }

    const entries = directoryEntries();
    const matches = entries.filter((entry) => entry.name.startsWith(prefix));

    if (!matches.length) {
      setCompletionOptions([]);
      return;
    }

    const applyCompletion = (completed: string, trailing?: string) => {
      const completedToken = quotePrefix ? `${quotePrefix}${completed}` : completed;
      const nextValue = `${baseText}${completedToken}${trailing ?? ""}${suffixText}`;
      setTerminalText(nextValue);
      setCompletionOptions([]);
    };

    if (matches.length === 1) {
      const matchEntry = matches[0];
      const trailing = matchEntry.isDirectory ? "/" : " ";
      applyCompletion(matchEntry.name, trailing);
      return;
    }

    const commonPrefix = findCommonPrefix(matches.map((entry) => entry.name));
    if (commonPrefix.length > prefix.length) {
      applyCompletion(commonPrefix);
      return;
    }

    const formattedOptions = matches.map((entry) => entry.isDirectory ? `${entry.name}/` : entry.name);
    setCompletionOptions(formattedOptions);
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

    if (e.key === "Tab") {
      e.preventDefault();
      handleAutocomplete();
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
    if (completionOptions.length) {
      setCompletionOptions([]);
    }
  };

  const runCommand = (command: ParsedCommand, rawInput: string) => {
    if (command.name === "clear") {
      setTerminalText("");
      setPrompts([]);
      setCompletionOptions([]);
      return;
    }

    if (!SUPPORTED_COMMANDS.has(command.name)) {
      logPrompt({ text: `Error: command ${command.name} not found` }, rawInput);
      setTerminalText("");
      setCompletionOptions([]);
      return;
    }

    if (COMMANDS_REQUIRING_ARGS.has(command.name) && command.args.length === 0) {
      logPrompt({ text: `Error: command ${command.name} hasn't received an argument` }, rawInput);
      setTerminalText("");
      setCompletionOptions([]);
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
    setCompletionOptions([]);
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
      case "cd": {
        const resolved = resolveDirectoryPath(body, currentDir.current, rootDirectory, currentPath.current);
        if ("error" in resolved) {
          output = { text: `Error: ${resolved.error}` };
          break;
        }
        currentDir.current = resolved.directory;
        currentPath.current = resolved.path;
        output = { text: "" };
        break;
      }
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
      case "help":
        output = cat(howToFile);
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
        {completionOptions.length ? (
          <div className="text-2xl font-[Terminal] text-gray-300 pl-3">
            {completionOptions.join("  ")}
          </div>
        ) : null}
      </div>
    )
  }

  useEffect(() => {
    const loadMarkdownFiles = async () => {
      await Promise.all(MARKDOWN_SOURCES.map(async ({ file, url, label }) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`status ${response.status}`);
          }
          const markdown = await response.text();
          file.contentArray.splice(0, file.contentArray.length);
          file.appendContent(markdown);
        } catch (error) {
          file.contentArray.splice(0, file.contentArray.length);
          const message = error instanceof Error ? error.message : "unknown error";
          file.appendContent(`Failed to load ${label}: ${message}`);
        }
      }));
    };
    loadMarkdownFiles();
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
