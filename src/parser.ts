export type TokenizeResult = {
  tokens: string[];
  error?: string;
};

export type ParsedCommand = {
  name: string;
  args: string[];
  redirectTarget?: string;
};

const WHITESPACE = /\s/;

/**
 * Splits a command string into tokens while allowing quoted sections to keep spaces.
 * Example: tokenizeInput('echo "hello world" > file') -> ["echo", "hello world", ">", "file"]
 */
export function tokenizeInput(raw: string): TokenizeResult {
  const input = raw.trim();
  if (!input) {
    return { tokens: [] };
  }

  const tokens: string[] = [];
  let current = "";
  let capturing = false;
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (char === "\"") {
      if (inQuotes) {
        inQuotes = false;
      } else {
        inQuotes = true;
        capturing = true;
      }
      continue;
    }

    if (!inQuotes && WHITESPACE.test(char)) {
      if (capturing) {
        tokens.push(current);
        current = "";
        capturing = false;
      }
      continue;
    }

    current += char;
    capturing = true;
  }

  if (inQuotes) {
    return { tokens, error: "Unterminated quote" };
  }

  if (capturing) {
    tokens.push(current);
  }

  return { tokens };
}

export type ParseCommandResult =
  | { command: ParsedCommand; error?: undefined }
  | { command?: undefined; error: string };

export function parseCommand(raw: string): ParseCommandResult {
  const { tokens, error } = tokenizeInput(raw);

  if (error) {
    return { error };
  }

  if (!tokens.length) {
    return { error: "No command provided" };
  }

  const redirectIndex = tokens.indexOf(">");
  if (redirectIndex !== -1) {
    if (redirectIndex === tokens.length - 1) {
      return { error: "Redirection missing target file" };
    }
    if (tokens.indexOf(">", redirectIndex + 1) !== -1) {
      return { error: "Multiple redirections are not supported" };
    }
  }

  const name = tokens[0];
  const args = tokens.slice(1);
  let redirectTarget: string | undefined;

  if (redirectIndex !== -1) {
    redirectTarget = tokens[redirectIndex + 1];
    args.splice(redirectIndex - 1);
  }

  return { command: { name, args, redirectTarget } };
}
