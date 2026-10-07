import { Prism } from "prism-react-renderer";

// Extra grammars defined inline (no global Prism needed, safe for the production server bundle).
const comment = { pattern: /(^|[^\\$])#.*/, lookbehind: true, greedy: true };
const string = { pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/, greedy: true };
const variable = /\$\{?[\w:]+\}?/;

Prism.languages["bash"] = {
  comment,
  string,
  variable,
  function: { pattern: /(^|[\s;|&]|[<>]\()(?:bundle|fastlane|gem|ruby|rbenv|brew|git|cp|rm|mkdir|touch|cd|npm|firebase|pod)(?=$|[\s;|&])/m, lookbehind: true },
  operator: /&&|\|\||[|;<>]|→/,
  number: /\b\d+(?:\.\d+)*\b/,
};
Prism.languages["shell"] = Prism.languages["bash"];

Prism.languages["powershell"] = {
  comment,
  string,
  variable: /\$[\w:]+/,
  function: /\b[A-Z][a-z]+-[A-Z]\w+\b/,
  keyword: /\b(?:ruby|gem|ridk|bundle|where\.exe)\b/,
  parameter: { pattern: /\s-[A-Za-z]\w*/, alias: "property" },
  operator: /[|=@;]|→/,
  punctuation: /[{}()[\],]/,
};

Prism.languages["ruby"] = {
  comment,
  string,
  symbol: { pattern: /:[a-z_]\w*/, alias: "constant" },
  keyword: /\b(?:if|else|elsif|end|def|do|unless|return|require|source|gem)\b/,
  function: /\b\w+(?=\()/,
  constant: /\b[A-Z]\w*\b/,
  number: /\b\d+(?:\.\d+)*\b/,
  punctuation: /[{}()[\],.;]/,
};

Prism.languages["ignore"] = {
  comment: /^#.*/m,
  entry: { pattern: /\S.*/, alias: "string", inside: { operator: /^!|\*|\//, punctuation: /\./ } },
};

export { Prism };
