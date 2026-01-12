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
import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
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
  return /^\s*assert\s*[({]/.test(code);
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
    execSync(`scaf fmt "${tempPath}"`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { success: true };
  } catch (err: unknown) {
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
 * Validate code with auto-detection heuristics
 */
function validateWithAutoDetect(code: string): ValidationResult {
  // Strategy 1: Try parsing as-is
  const direct = tryParse(code);
  if (direct.success) return direct;

  // Strategy 2: If looks like a scope (test/group blocks), wrap and retry
  if (looksLikeScope(code)) {
    const wrapped = wrapAsScope(code);
    const result = tryParse(wrapped.code);
    if (result.success) return { success: true };
    // Adjust error line for wrapper offset
    if (result.errorLine !== undefined) {
      result.errorLine -= wrapped.offset;
      if (result.errorLine < 1) result.errorLine = 1;
    }
    return result;
  }

  // Strategy 3: If looks like an assert fragment, wrap in test and retry
  if (looksLikeAssert(code)) {
    const wrapped = wrapAsTest(code);
    const result = tryParse(wrapped.code);
    if (result.success) return { success: true };
    if (result.errorLine !== undefined) {
      result.errorLine -= wrapped.offset;
      if (result.errorLine < 1) result.errorLine = 1;
    }
    return result;
  }

  // All strategies failed - return original error
  return direct;
}

/**
 * Remark plugin to validate scaf code blocks
 */
export function remarkScafValidate() {
  return (tree: Root, file: VFile) => {
    visit(tree, "code", (node: Code) => {
      // Only process scaf blocks
      if (node.lang !== "scaf") return;

      // Escape hatch: skip validation for ```scaf skip
      if (node.meta === "skip") return;

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
        const errorLine = startLine + (result.errorLine ?? 1);
        file.fail(`scaf syntax error: ${result.error}`, {
          line: errorLine,
          column: 1,
        });
      }
    });
  };
}

export default remarkScafValidate;
