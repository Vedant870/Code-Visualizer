const codeInput = document.getElementById("codeInput");
const languageSelect = document.getElementById("languageSelect");
const analyzeBtn = document.getElementById("analyzeBtn");
const sampleBtn = document.getElementById("sampleBtn");
const clearBtn = document.getElementById("clearBtn");
const themeToggle = document.getElementById("themeToggle");
const fontSize = document.getElementById("fontSize");
const copyExplainBtn = document.getElementById("copyExplainBtn");
const copyCodeBtn = document.getElementById("copyCodeBtn");
const prismLight = document.getElementById("prism-light");
const prismDark = document.getElementById("prism-dark");

const summaryEl = document.getElementById("summary");
const metricsEl = document.getElementById("metrics");
const constructsEl = document.getElementById("constructs");
const stepsEl = document.getElementById("steps");
const outlineEl = document.getElementById("outline");
const complexityEl = document.getElementById("complexity");
const issuesEl = document.getElementById("issues");
const suggestionsEl = document.getElementById("suggestions");
const flowEl = document.getElementById("flow");
const codePreview = document.getElementById("codePreview");
const lineExplanationEl = document.getElementById("lineExplanation");
const fxLayer = document.getElementById("fxLayer");
const cursorGlow = document.getElementById("cursorGlow");

const accentMap = {
  royal: { accent: "#5b7cff", accent2: "#8ea2ff" },
  mint: { accent: "#2fc39b", accent2: "#7ce8c3" },
  sunset: { accent: "#ff8c61", accent2: "#ffc08a" },
  neon: { accent: "#7c6cff", accent2: "#b4a9ff" },
};

const sampleLibrary = {
  java: `import java.util.*;

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    int n = sc.nextInt();
    int sum = 0;
    for (int i = 1; i <= n; i++) {
      sum += i;
    }
    System.out.println("Sum is " + sum);
  }
}`,
  python: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

num = int(input())
print(factorial(num))`,
  c: `#include <stdio.h>

int main() {
  int n;
  scanf("%d", &n);
  int count = 0;
  for (int i = 1; i <= n; i++) {
    if (n % i == 0) {
      count++;
    }
  }
  printf("Divisors: %d", count);
  return 0;
}`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
  int n;
  cin >> n;
  vector<int> data(n);
  for (int i = 0; i < n; i++) cin >> data[i];
  int best = data[0];
  for (int value : data) {
    if (value > best) best = value;
  }
  cout << "Max is " << best;
  return 0;
}`,
  javascript: `function isPrime(n) {
  if (n <= 1) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

const input = 17;
console.log(isPrime(input));`,
};

const languageLabels = {
  java: "Java",
  python: "Python",
  c: "C",
  cpp: "C++",
  javascript: "JavaScript",
  other: "Other",
  auto: "Auto",
};

const patterns = {
  loops: /\b(for|while|do)\b/g,
  conditionals: /\b(if|else if|else|elif|switch|case)\b/g,
  classes: /\bclass\s+[A-Za-z_][\w$]*/g,
  imports: /\bimport\b|#include\b|\busing\s+namespace\b/g,
  io: /\b(input\(|print\(|printf\(|scanf\(|cout\b|cin\b|System\.out\.|console\.log|readLine\b|getline\b)/g,
  errors: /\btry\b|\bcatch\b|\bexcept\b|\bfinally\b|\bthrow\b|\bthrows\b/g,
  dataStructures:
    /\b(List|ArrayList|Map|HashMap|Set|dict|list|vector|array|queue|stack|deque)\b/g,
};

const keywordBlocklist = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "return",
  "sizeof",
  "printf",
  "scanf",
]);

const accentButtons = document.querySelectorAll(".accent-swatch");

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  prismDark.disabled = !isDark;
  prismLight.disabled = isDark;
  themeToggle.textContent = isDark ? "Dark" : "Light";
}

function setAccent(key) {
  const palette = accentMap[key];
  if (!palette) return;
  document.documentElement.style.setProperty("--accent", palette.accent);
  document.documentElement.style.setProperty("--accent-2", palette.accent2);
  document.documentElement.style.setProperty("--accent-3", palette.accent2);
}

function detectLanguage(code) {
  if (/\bdef\s+\w+\s*\(/.test(code) || /\bprint\(/.test(code)) return "python";
  if (/System\.out\.|public\s+static\s+void\s+main/.test(code)) return "java";
  if (/#include|\bprintf\b|\bscanf\b/.test(code)) return "c";
  if (/\bcout\b|\bcin\b|using\s+namespace\s+std/.test(code)) return "cpp";
  if (/\bconsole\.log\b|function\s+\w+\s*\(|=>/.test(code)) return "javascript";
  return "javascript";
}

function getPrismLanguage(language) {
  if (language === "other") return "none";
  if (language === "cpp") return "cpp";
  return language;
}

function countMatches(regex, text) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function getLines(code) {
  return code.split(/\r?\n/);
}

function getMetrics(lines) {
  let commentLines = 0;
  let nonEmpty = 0;
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length > 0) nonEmpty += 1;
    if (/^(\/\/|#|\/\*|\*|\*\/)/.test(trimmed)) commentLines += 1;
  });
  return {
    totalLines: lines.length,
    nonEmptyLines: nonEmpty,
    commentLines,
  };
}

function extractClasses(lines) {
  const results = [];
  lines.forEach((line, index) => {
    const match = line.match(/\bclass\s+([A-Za-z_][\w$]*)/);
    if (match) results.push({ name: match[1], line: index + 1 });
  });
  return results;
}

function extractFunctions(code, lines, language) {
  const results = [];
  if (language === "python") {
    lines.forEach((line, index) => {
      const match = line.match(/\bdef\s+([A-Za-z_][\w$]*)\s*\(/);
      if (match) results.push({ name: match[1], line: index + 1 });
    });
    return results;
  }

  if (language === "javascript") {
    const regexes = [
      /\bfunction\s+([A-Za-z_][\w$]*)\s*\(/g,
      /\b(?:const|let|var)\s+([A-Za-z_][\w$]*)\s*=\s*\([^)]*\)\s*=>/g,
      /\b([A-Za-z_][\w$]*)\s*=\s*function\s*\(/g,
    ];
    regexes.forEach((regex) => {
      let match;
      while ((match = regex.exec(code))) {
        const name = match[1];
        if (!keywordBlocklist.has(name)) {
          results.push({ name, line: findLineNumber(lines, name) });
        }
      }
    });
    return uniqueByName(results);
  }

  const signatureRegex =
    /(?:public|private|protected|static|final|synchronized|inline|virtual|constexpr|friend|abstract|native|strictfp|\s)+[\w:<>,\[\]]+\s+([A-Za-z_][\w$]*)\s*\(/g;
  let match;
  while ((match = signatureRegex.exec(code))) {
    const name = match[1];
    if (!keywordBlocklist.has(name)) {
      results.push({ name, line: findLineNumber(lines, name) });
    }
  }
  return uniqueByName(results);
}

function uniqueByName(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item.name || seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

function findLineNumber(lines, token) {
  const index = lines.findIndex((line) => line.includes(token));
  return index >= 0 ? index + 1 : 1;
}

function detectRecursion(code, functions) {
  return functions.some((fn) => {
    const regex = new RegExp(`\\b${fn.name}\\s*\\(`, "g");
    const matches = code.match(regex);
    return matches && matches.length > 1;
  });
}

function estimateLoopDepth(lines, language) {
  const loopRegex = /\b(for|while|do)\b/;
  let maxDepth = 0;

  if (language === "python") {
    const stack = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const indent = line.match(/^\s*/)[0].replace(/\t/g, "    ").length;
      while (stack.length && indent <= stack[stack.length - 1]) {
        stack.pop();
      }
      if (loopRegex.test(trimmed) && trimmed.endsWith(":")) {
        stack.push(indent);
        maxDepth = Math.max(maxDepth, stack.length);
      }
    });
    return maxDepth;
  }

  let braceDepth = 0;
  const activeLoops = [];
  lines.forEach((line) => {
    if (loopRegex.test(line)) {
      activeLoops.push(braceDepth + 1);
      maxDepth = Math.max(maxDepth, activeLoops.length);
    }
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    braceDepth += opens - closes;
    while (activeLoops.length && braceDepth < activeLoops[activeLoops.length - 1]) {
      activeLoops.pop();
    }
  });

  return maxDepth;
}

function estimateComplexity(loopDepth, recursion) {
  if (recursion) {
    return {
      time: "Potentially recursive (check base case and branching).",
      space: "Uses call stack proportional to depth.",
    };
  }
  if (loopDepth === 0) return { time: "O(1)", space: "O(1)" };
  if (loopDepth === 1) return { time: "O(n)", space: "O(1)" };
  if (loopDepth === 2) return { time: "O(n²)", space: "O(1)" };
  return { time: "O(n^k) with k ≥ 3", space: "O(1)" };
}

function buildConstructs(stats) {
  const constructs = [];
  if (stats.classes > 0) constructs.push({ label: "Classes", detail: "Defines data models or structures." });
  if (stats.functions > 0) constructs.push({ label: "Functions", detail: "Reusable logic blocks." });
  if (stats.loops > 0) constructs.push({ label: "Loops", detail: "Repeats actions over data." });
  if (stats.conditionals > 0)
    constructs.push({ label: "Conditionals", detail: "Decision-making branches." });
  if (stats.imports > 0) constructs.push({ label: "Imports", detail: "Uses external libraries." });
  if (stats.io > 0) constructs.push({ label: "Input/Output", detail: "Reads or prints values." });
  if (stats.dataStructures > 0)
    constructs.push({ label: "Data Structures", detail: "Stores data in lists, maps, or arrays." });
  if (stats.errors > 0) constructs.push({ label: "Error Handling", detail: "Handles exceptions safely." });
  if (stats.recursion) constructs.push({ label: "Recursion", detail: "Function calls itself." });
  return constructs;
}

function generateSteps(stats) {
  const steps = [];
  if (stats.imports > 0) steps.push("Load dependencies and libraries needed for the program.");
  if (stats.classes > 0) steps.push("Define classes to organize data or behavior.");
  if (stats.functions > 0) steps.push("Declare helper functions for reuse.");
  if (stats.io > 0) steps.push("Read input values or prepare data to process.");
  if (stats.dataStructures > 0) steps.push("Initialize data structures to hold information.");
  if (stats.loops > 0) steps.push("Iterate through data using loops to compute results.");
  if (stats.conditionals > 0) steps.push("Apply decision logic to handle different cases.");
  if (stats.errors > 0) steps.push("Protect critical logic with error handling.");
  steps.push("Produce output and finish execution.");
  return steps;
}

function generateIssues(stats, metrics, loopDepth) {
  const issues = [];
  if (loopDepth >= 2) issues.push("Nested loops may be slow for large inputs.");
  if (stats.recursion) issues.push("Ensure recursion has a clear base case to avoid infinite calls.");
  if (metrics.totalLines > 30 && metrics.commentLines === 0) {
    issues.push("Consider adding comments for beginners reading this code.");
  }
  if (stats.io > 0 && stats.errors === 0) issues.push("Input validation or error handling could be added.");
  if (issues.length === 0) issues.push("No obvious issues detected. Looks beginner-friendly!");
  return issues;
}

function generateSuggestions(stats) {
  const tips = [];
  tips.push("Use meaningful variable names to make the intent clear.");
  if (stats.functions === 0) tips.push("Break logic into functions for easier understanding.");
  if (stats.conditionals > 3) tips.push("Too many branches? Consider simplifying or using helper functions.");
  if (stats.dataStructures > 0) tips.push("Explain why each data structure was chosen.");
  if (stats.loops > 0) tips.push("Mention the loop purpose and stopping condition in comments.");
  return tips;
}

function generateFlow(stats) {
  const flow = ["Start", "Read input", "Process logic", "Output", "End"];
  if (stats.imports > 0) flow.unshift("Load libraries");
  if (stats.dataStructures > 0) flow.splice(2, 0, "Initialize data");
  if (stats.loops > 0) flow.splice(flow.length - 2, 0, "Repeat over data");
  return flow;
}

function explainLine(line, language) {
  const trimmed = line.trim();
  if (!trimmed) return "Blank line to separate logical steps.";

  if (/^(\/\/|#|\/\*|\*|\*\/)/.test(trimmed)) {
    return "Comment explaining intent or notes for readers.";
  }

  if (/^package\s+/.test(trimmed)) {
    return "Declares the package/namespace for this file.";
  }

  if (/\bimport\b/.test(trimmed) || /#include\b/.test(trimmed) || /\busing\s+namespace\b/.test(trimmed)) {
    return "Imports/includes external libraries needed for this program.";
  }

  const classMatch = trimmed.match(/\bclass\s+([A-Za-z_][\w$]*)/);
  if (classMatch) {
    return `Defines a class named ${classMatch[1]} to group data and behavior.`;
  }

  if (/public\s+static\s+void\s+main\s*\(/.test(trimmed)) {
    return "Program entry point starts here (main method).";
  }

  if (language === "python") {
    const defMatch = trimmed.match(/^def\s+([A-Za-z_][\w$]*)\s*\(/);
    if (defMatch) {
      return `Defines a function named ${defMatch[1]}.`;
    }
  }

  const jsFuncMatch = trimmed.match(/\bfunction\s+([A-Za-z_][\w$]*)\s*\(/);
  if (jsFuncMatch) {
    return `Defines a function named ${jsFuncMatch[1]}.`;
  }

  const arrowMatch = trimmed.match(/\b(?:const|let|var)\s+([A-Za-z_][\w$]*)\s*=\s*\([^)]*\)\s*=>/);
  if (arrowMatch) {
    return `Defines an arrow function named ${arrowMatch[1]}.`;
  }

  const signatureMatch = trimmed.match(/\b([A-Za-z_][\w$]*)\s*\([^;]*\)\s*\{/);
  if (signatureMatch && !keywordBlocklist.has(signatureMatch[1])) {
    return `Begins a function or method named ${signatureMatch[1]}.`;
  }

  if (/\b(if|else if|elif)\b/.test(trimmed)) {
    return "Checks a condition to choose which path to run.";
  }

  if (/\belse\b/.test(trimmed)) {
    return "Fallback branch when previous conditions are false.";
  }

  if (/\bfor\b/.test(trimmed)) {
    return "Starts a loop that repeats a set of steps.";
  }

  if (/\bwhile\b/.test(trimmed)) {
    return "Repeats the block while a condition stays true.";
  }

  if (/\bswitch\b/.test(trimmed)) {
    return "Starts a multi-branch selection using switch.";
  }

  if (/\bcase\b/.test(trimmed)) {
    return "Defines a specific switch case to match.";
  }

  if (/\breturn\b/.test(trimmed)) {
    return "Returns a value and exits the current function.";
  }

  if (/\btry\b/.test(trimmed)) {
    return "Starts a protected block to catch errors.";
  }

  if (/\bcatch\b|\bexcept\b/.test(trimmed)) {
    return "Handles an error or exception if one occurs.";
  }

  if (/\bfinally\b/.test(trimmed)) {
    return "Runs cleanup code after try/catch.";
  }

  if (/\bthrow\b/.test(trimmed)) {
    return "Throws an error/exception intentionally.";
  }

  if (/System\.out\.|console\.log|\bprint\(|\bprintf\(|\bcout\b/.test(trimmed)) {
    return "Outputs information to the console or screen.";
  }

  if (/\binput\(|\bscanf\(|\bcin\b/.test(trimmed)) {
    return "Reads input from the user or standard input.";
  }

  if (/^[{}]$/.test(trimmed)) {
    return trimmed === "{" ? "Opens a new block of code." : "Closes the current block.";
  }

  if (/\bnew\s+[A-Za-z_][\w$]*/.test(trimmed)) {
    return "Creates a new object/instance.";
  }

  if (/^(const|let|var|int|long|short|double|float|char|boolean|bool|string|String)\b/i.test(trimmed)) {
    return "Declares a variable and possibly assigns an initial value.";
  }

  if (/^[A-Za-z_][\w$]*\s*=/.test(trimmed)) {
    return "Assigns or updates a variable with a value.";
  }

  if (/\w+\s*\(.*\)\s*;?$/.test(trimmed)) {
    return "Calls a function or method to perform an action.";
  }

  return "Executes this line of logic.";
}

function buildLineByLine(lines, language) {
  return lines.map((line, index) => ({
    line: index + 1,
    code: line,
    explanation: explainLine(line, language),
  }));
}

function formatSummary(language, stats, metrics) {
  const langName = languageLabels[language] || "Code";
  return `This ${langName} snippet has ${metrics.nonEmptyLines} effective lines, ` +
    `${stats.functions} function(s), and ${stats.classes} class(es). ` +
    `${stats.loops ? "It uses loops" : "It does not use loops"} and ` +
    `${stats.conditionals ? "includes decision logic" : "keeps logic straightforward"}.`;
}

function analyzeCode(rawCode, selectedLanguage) {
  const code = rawCode.trim() || "";
  const language = selectedLanguage === "auto" ? detectLanguage(code) : selectedLanguage;
  const lines = getLines(code);
  const metrics = getMetrics(lines);
  const functions = extractFunctions(code, lines, language);
  const classes = extractClasses(lines);

  const stats = {
    functions: functions.length,
    classes: classes.length,
    loops: countMatches(patterns.loops, code),
    conditionals: countMatches(patterns.conditionals, code),
    imports: countMatches(patterns.imports, code),
    io: countMatches(patterns.io, code),
    errors: countMatches(patterns.errors, code),
    dataStructures: countMatches(patterns.dataStructures, code),
    recursion: detectRecursion(code, functions),
  };

  const loopDepth = estimateLoopDepth(lines, language);
  const complexity = estimateComplexity(loopDepth, stats.recursion);
  const constructs = buildConstructs(stats);
  const steps = generateSteps(stats);
  const issues = generateIssues(stats, metrics, loopDepth);
  const suggestions = generateSuggestions(stats);
  const flow = generateFlow(stats);

  return {
    language,
    metrics,
    stats,
    functions,
    classes,
    complexity,
    constructs,
    steps,
    issues,
    suggestions,
    flow,
    lineByLine: buildLineByLine(lines, language),
    summary: formatSummary(language, stats, metrics),
  };
}

function renderMetrics(metrics, stats) {
  metricsEl.innerHTML = "";
  const items = [
    { label: "Total Lines", value: metrics.totalLines },
    { label: "Effective Lines", value: metrics.nonEmptyLines },
    { label: "Comments", value: metrics.commentLines },
    { label: "Functions", value: stats.functions },
    { label: "Classes", value: stats.classes },
  ];
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `${item.label}<span>${item.value}</span>`;
    metricsEl.appendChild(card);
  });
}

function renderChips(constructs) {
  constructsEl.innerHTML = "";
  constructs.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = item.label;
    chip.title = item.detail;
    constructsEl.appendChild(chip);
  });
  if (!constructs.length) {
    constructsEl.innerHTML = "<span class=\"chip\">No constructs detected</span>";
  }
}

function renderList(target, items) {
  target.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    target.appendChild(li);
  });
}

function renderOutline(outlineTarget, functions, classes) {
  outlineTarget.innerHTML = "";
  const entries = [
    ...classes.map((cls) => `Class: ${cls.name} (line ${cls.line})`),
    ...functions.map((fn) => `Function: ${fn.name} (line ${fn.line})`),
  ];
  if (!entries.length) {
    const empty = document.createElement("li");
    empty.textContent = "No functions or classes detected.";
    outlineTarget.appendChild(empty);
    return;
  }
  entries.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    outlineTarget.appendChild(li);
  });
}

function renderFlow(flow) {
  flowEl.innerHTML = "";
  flow.forEach((step) => {
    const chip = document.createElement("span");
    chip.className = "flow-step";
    chip.textContent = step;
    flowEl.appendChild(chip);
  });
}

function renderLineByLine(lines) {
  lineExplanationEl.innerHTML = "";
  if (!lines.length) {
    lineExplanationEl.innerHTML =
      "<div class=\"line-row\"><strong>--</strong><div class=\"line-code\">(empty)</div><p>No code to explain yet.</p></div>";
    return;
  }
  lines.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "line-row";
    const safeCode = entry.code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    row.innerHTML = `
      <strong>L${entry.line}</strong>
      <div class="line-code">${safeCode || "(blank)"}</div>
      <p>${entry.explanation}</p>
    `;
    lineExplanationEl.appendChild(row);
  });
}

function renderComplexity(complexity, loopDepth) {
  complexityEl.innerHTML = `
    <strong>Time:</strong> ${complexity.time}<br />
    <strong>Space:</strong> ${complexity.space}<br />
    <small>Loop depth estimate: ${loopDepth}</small>
  `;
}

function updatePreview(code, language) {
  const prismLang = getPrismLanguage(language);
  codePreview.className = `language-${prismLang}`;
  codePreview.textContent = code || "";
  if (window.Prism) {
    Prism.plugins.autoloader.languages_path =
      "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/";
    Prism.highlightElement(codePreview);
  }
}

function analyzeAndRender() {
  const input = codeInput.value.trim();
  if (!input) {
    summaryEl.textContent = "Paste code to see a friendly breakdown.";
    metricsEl.innerHTML = "";
    constructsEl.innerHTML = "";
    stepsEl.innerHTML = "";
    outlineEl.innerHTML = "";
    issuesEl.innerHTML = "";
    suggestionsEl.innerHTML = "";
    flowEl.innerHTML = "";
    complexityEl.textContent = "";
    lineExplanationEl.innerHTML = "";
    updatePreview("", "none");
    return;
  }

  const analysis = analyzeCode(input, languageSelect.value);
  const loopDepth = estimateLoopDepth(getLines(input), analysis.language);
  summaryEl.textContent = analysis.summary;
  renderMetrics(analysis.metrics, analysis.stats);
  renderChips(analysis.constructs);
  renderList(stepsEl, analysis.steps);
  renderOutline(outlineEl, analysis.functions, analysis.classes);
  renderList(issuesEl, analysis.issues);
  renderList(suggestionsEl, analysis.suggestions);
  renderFlow(analysis.flow);
  renderLineByLine(analysis.lineByLine);
  renderComplexity(analysis.complexity, loopDepth);
  updatePreview(input, analysis.language);
}

function loadSample() {
  const selected = languageSelect.value === "auto" ? "java" : languageSelect.value;
  const sample = sampleLibrary[selected] || sampleLibrary.java;
  codeInput.value = sample;
  analyzeAndRender();
}

function clearAll() {
  codeInput.value = "";
  analyzeAndRender();
}

function copyExplanation() {
  const text = [
    summaryEl.textContent,
    "\nSteps:",
    ...Array.from(stepsEl.children).map((li, index) => `${index + 1}. ${li.textContent}`),
    "\nTips:",
    ...Array.from(suggestionsEl.children).map((li) => `- ${li.textContent}`),
  ].join("\n");
  navigator.clipboard.writeText(text);
  copyExplainBtn.textContent = "Copied!";
  setTimeout(() => (copyExplainBtn.textContent = "Copy Explanation"), 1200);
}

function copyCode() {
  navigator.clipboard.writeText(codeInput.value || "");
  copyCodeBtn.textContent = "Copied!";
  setTimeout(() => (copyCodeBtn.textContent = "Copy Code"), 1200);
}

analyzeBtn.addEventListener("click", analyzeAndRender);
sampleBtn.addEventListener("click", loadSample);
clearBtn.addEventListener("click", clearAll);
copyExplainBtn.addEventListener("click", copyExplanation);
copyCodeBtn.addEventListener("click", copyCode);

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  setTheme(current === "dark" ? "light" : "dark");
});

fontSize.addEventListener("input", (event) => {
  const size = event.target.value;
  document.documentElement.style.setProperty("--editor-size", `${size}px`);
  codeInput.style.fontSize = `${size}px`;
});

languageSelect.addEventListener("change", () => {
  if (languageSelect.value !== "auto" && sampleLibrary[languageSelect.value]) {
    codeInput.value = sampleLibrary[languageSelect.value];
  }
  analyzeAndRender();
});

accentButtons.forEach((button) => {
  button.addEventListener("click", () => setAccent(button.dataset.accent));
});

const interactiveCards = document.querySelectorAll(".interactive-card");
interactiveCards.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rx = ((y / rect.height) - 0.5) * -8;
    const ry = ((x / rect.width) - 0.5) * 8;
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    card.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
    card.style.setProperty("--my", `${(y / rect.height) * 100}%`);
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

function createRipple(x, y) {
  if (!fxLayer) return;
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  fxLayer.appendChild(ripple);
  setTimeout(() => ripple.remove(), 1400);
}

let lastRippleTime = 0;
const rippleBlocklist = new Set(["TEXTAREA", "INPUT", "SELECT", "OPTION"]);

document.addEventListener("pointermove", (event) => {
  if (!cursorGlow) return;
  const { clientX, clientY } = event;
  cursorGlow.style.left = `${clientX}px`;
  cursorGlow.style.top = `${clientY}px`;
  cursorGlow.style.opacity = "0.85";

  const now = Date.now();
  if (now - lastRippleTime > 160 && !rippleBlocklist.has(event.target.tagName)) {
    createRipple(clientX, clientY);
    lastRippleTime = now;
  }
});

document.addEventListener("pointerdown", (event) => {
  if (!rippleBlocklist.has(event.target.tagName)) {
    createRipple(event.clientX, event.clientY);
  }
});

document.addEventListener("mouseleave", () => {
  if (cursorGlow) cursorGlow.style.opacity = "0";
});

setTheme("dark");
setAccent("royal");
loadSample();
