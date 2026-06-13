import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { platform } from "node:os";
import type {
  LLMProvider,
  GenerateOptions,
  GenerateResult,
} from "./types";
import { ProviderUnavailableError } from "./types";

const execFileAsync = promisify(execFile);
const CLAUDE_CMD = platform() === "win32" ? "claude.cmd" : "claude";

// Uses the user's Claude Code subscription via the `claude` CLI in headless
// mode. Zero API cost for the user. Requires Claude Code to be installed and
// logged in on this machine.
export const claudeCliProvider: LLMProvider = {
  id: "claude-cli",
  label: "Claude Code (subscription)",
  description:
    "Uses your local Claude Code CLI subscription. No API key needed. Must be installed and logged in.",

  async isAvailable() {
    try {
      await execFileAsync(CLAUDE_CMD, ["--version"], { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  },

  async generate(
    prompt: string,
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    const args = ["-p", prompt, "--output-format", "json"];
    if (options.systemPrompt) {
      args.push("--append-system-prompt", options.systemPrompt);
    }
    if (options.model) {
      args.push("--model", options.model);
    }

    try {
      const { stdout } = await execFileAsync(CLAUDE_CMD, args, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 5 * 60 * 1000,
      });
      const json = JSON.parse(stdout) as {
        result?: string;
        usage?: { input_tokens?: number; output_tokens?: number };
        model?: string;
      };
      return {
        text: json.result ?? "",
        provider: "claude-cli",
        model: json.model ?? "claude",
        usage: {
          inputTokens: json.usage?.input_tokens,
          outputTokens: json.usage?.output_tokens,
        },
      };
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e.code === "ENOENT") {
        throw new ProviderUnavailableError(
          "claude-cli",
          "`claude` CLI not found on PATH. Install Claude Code from https://claude.com/claude-code or use a different provider.",
        );
      }
      throw err;
    }
  },
};
