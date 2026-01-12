/**
 * Remark plugin to validate scaf code blocks in MDX documentation.
 *
 * Algorithm:
 * 1. Try parsing code as-is with scaf fmt
 * 2. If fails and looks like a scope (contains test/group), wrap with dummy fn and retry
 * 3. Report original error if all strategies fail
 *
 * Escape hatch: Use ```scaf skip to skip validation for intentionally broken examples
 */

import { visit } from "unist-util-visit";
import { execFileSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { Plugin } from "unified";
import type { Root, Code } from "mdast";
import type { VFile } from "vfile";

interface ValidationResult {
  success: boolean;
  error?: string;
  errorLine?: number;
}

interface WrapResult {
  code: string;
  offset: number;
}

/**
 * Check if code looks like a scope block (contains test or group blocks)
 */
function looksLikeScope(code: string): boolean {
  // Match test "..." or group "..." patterns
  return /\btest\s+"/.test(code) || /\bgroup\s+"/.test(code);
}

/**
 * Check if code looks like an assert block fragment
 */
function looksLikeAssert(code: string): boolean {
  // Use multiline flag to match assert anywhere in the code
  return /^\s*assert\s*[({]/m.test(code);
}

/**
 * Wrap code as a function scope for parsing
 * Creates: fn __s__() `q`\n__s__ {\n<code>\n}
 */
function wrapAsScope(code: string): WrapResult {
  const wrapper = "fn __s__() `q`\n__s__ {\n";
  const footer = "\n}";
  return {
    code: wrapper + code + footer,
    offset: 2, // 2 lines of wrapper before actual code
  };
}

/**
 * Wrap code as a test block for assert fragments
 * Creates: fn __s__() `q`\n__s__ {\ntest "t" {\n<code>\n}\n}
 */
function wrapAsTest(code: string): WrapResult {
  const wrapper = 'fn __s__() `q`\n__s__ {\ntest "t" {\n';
  const footer = "\n}\n}";
  return {
    code: wrapper + code + footer,
    offset: 3, // 3 lines of wrapper before actual code
  };
}

const SCAF_NOT_FOUND = "scaf CLI not found in PATH";

/**
 * Try to parse scaf code using scaf fmt
 */
function tryParse(code: string): ValidationResult {
  const tempPath = join(
    tmpdir(),
    `scaf-validate-${Date.now()}-${Math.random().toString(36).slice(2)}.scaf`,
  );
  writeFileSync(tempPath, code);

  try {
    // Use execFileSync to avoid shell quoting issues
    execFileSync("scaf", ["fmt", tempPath], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { success: true };
  } catch (err: unknown) {
    // Check if scaf CLI is not found
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      return { success: false, error: SCAF_NOT_FOUND };
    }

    const error = err as { stderr?: string; message?: string };
    const stderr = error.stderr ?? error.message ?? "unknown error";

    // Parse error format: "error: file.scaf: 3:5: message"
    // Extract just the line number and message, not the filepath
    const match = stderr.match(/:\s*(\d+):\d+:\s*(.+)/);
    if (match) {
      return {
        success: false,
        error: match[2].trim(),
        errorLine: parseInt(match[1], 10),
      };
    }

    // Fallback: strip "error: <filepath>:" prefix if present
    const cleanError = stderr.replace(/^error:\s*[^:]+:\s*/, "").trim();
    return { success: false, error: cleanError || stderr.trim() };
  } finally {
    try {
      unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Adjust error line for wrapper offset, returning a new result (no mutation)
 */
function adjustErrorLine(
  result: ValidationResult,
  offset: number,
): ValidationResult {
  if (result.errorLine === undefined) return result;
  const adjustedLine = Math.max(1, result.errorLine - offset);
  return { ...result, errorLine: adjustedLine };
}

/**
 * Validate code with auto-detection heuristics
 */
function validateWithAutoDetect(code: string): ValidationResult {
  // Strategy 1: Try parsing as-is
  const direct = tryParse(code);
  if (direct.success) return direct;

  // Short-circuit if scaf CLI not found - no point trying wrapped versions
  if (direct.error === SCAF_NOT_FOUND) return direct;

  // Strategy 2: If looks like a scope (test/group blocks), wrap and retry
  if (looksLikeScope(code)) {
    const wrapped = wrapAsScope(code);
    const result = tryParse(wrapped.code);
    if (result.success) return { success: true };
    return adjustErrorLine(result, wrapped.offset);
  }

  // Strategy 3: If looks like an assert fragment, wrap in test and retry
  if (looksLikeAssert(code)) {
    const wrapped = wrapAsTest(code);
    const result = tryParse(wrapped.code);
    if (result.success) return { success: true };
    return adjustErrorLine(result, wrapped.offset);
  }

  // All strategies failed - return original error
  return direct;
}

/**
 * Remark plugin to validate scaf code blocks
 */
export const remarkScafValidate: Plugin<[], Root> = () => {
  return (tree: Root, file: VFile) => {
    visit(tree, "code", (node: Code) => {
      // Only process scaf blocks
      if (node.lang !== "scaf") return;

      // Escape hatch: skip validation for ```scaf skip (with optional extra meta)
      if (node.meta?.split(/\s+/).includes("skip")) return;

      const code = node.value;

      // Skip pseudo-code blocks:
      // - Contains ... placeholders
      // - Contains incomplete fn stubs (fn Name without () or rawstring)
      // - Starts with a scope invocation (Name { ... }) without fn definition
      if (/\.\.\.|…/.test(code)) return;
      if (/^fn\s+[A-Z]\w*\s*$/m.test(code)) return;
      if (/^\s*[A-Z]\w*\s*\{/.test(code) && !/^\s*fn\s+/m.test(code)) return;

      const startLine = node.position?.start?.line ?? 0;

      const result = validateWithAutoDetect(code);

      if (!result.success) {
        // Calculate the actual line in the file
        // startLine is the line of ```, code starts on startLine + 1
        // errorLine is 1-based within the snippet, so line 1 of snippet = startLine + 1
        const errorLine = startLine + (result.errorLine ?? 1);
        file.fail(`scaf syntax error: ${result.error}`, {
          line: errorLine,
          column: 1,
        });
      }
    });
  };
};

export default remarkScafValidate;
