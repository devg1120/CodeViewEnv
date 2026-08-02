const languageMap = {
  // JavaScript/TypeScript
  'js': 'JavaScript',
  'jsx': 'JavaScript',
  'ts': 'TypeScript',
  'tsx': 'TypeScript',
  'mjs': 'JavaScript',
  'cjs': 'JavaScript',
  
  // Python
  'py': 'Python',
  'pyx': 'Python',
  'pyi': 'Python',
  
  // Web
  'html': 'HTML',
  'htm': 'HTML',
  'css': 'CSS',
  'scss': 'SCSS',
  'sass': 'Sass',
  'less': 'Less',
  
  // Java/JVM
  'java': 'Java',
  'kt': 'Kotlin',
  'scala': 'Scala',
  'groovy': 'Groovy',
  
  // C/C++
  'c': 'C',
  'cpp': 'C++',
  'cc': 'C++',
  'cxx': 'C++',
  'h': 'C/C++',
  'hpp': 'C++',
  
  // C#
  'cs': 'C#',
  
  // Go
  'go': 'Go',
  
  // Rust
  'rs': 'Rust',
  
  // PHP
  'php': 'PHP',
  
  // Ruby
  'rb': 'Ruby',
  
  // Swift
  'swift': 'Swift',
  
  // Shell
  'sh': 'Shell',
  'bash': 'Bash',
  'zsh': 'Zsh',
  'fish': 'Fish',
  
  // Config/Data
  'json': 'JSON',
  'xml': 'XML',
  'yaml': 'YAML',
  'yml': 'YAML',
  'toml': 'TOML',
  'ini': 'INI',
  'env': 'Environment',
  
  // Documentation
  'md': 'Markdown',
  'mdx': 'MDX',
  'rst': 'reStructuredText',
  'txt': 'Text',
  
  // SQL
  'sql': 'SQL',
  
  // Docker
  'dockerfile': 'Dockerfile',
  
  // Other
  'r': 'R',
  'matlab': 'MATLAB',
  'm': 'Objective-C',
  'pl': 'Perl',
  'lua': 'Lua',
  'dart': 'Dart',
  'elm': 'Elm',
  'ex': 'Elixir',
  'exs': 'Elixir',
  'clj': 'Clojure',
  'cljs': 'ClojureScript',
  'hs': 'Haskell',
  'ml': 'OCaml',
  'fs': 'F#',
  'nim': 'Nim',
  'zig': 'Zig',
  'v': 'V',
  'jl': 'Julia'
};

export function getLanguageFromExtension(extension) {
  if (!extension) return null;
  
  const normalized = extension.toLowerCase();
  return languageMap[normalized] || null;
}

export function getLanguageFromFilename(filename) {
  const lower = filename.toLowerCase();
  
  // Special cases
  if (lower === 'dockerfile') return 'Dockerfile';
  if (lower === 'makefile') return 'Makefile';
  if (lower === 'rakefile') return 'Ruby';
  if (lower === 'gemfile') return 'Ruby';
  if (lower === 'package.json') return 'JSON';
  if (lower === 'tsconfig.json') return 'JSON';
  if (lower === 'webpack.config.js') return 'JavaScript';
  if (lower === 'vite.config.ts') return 'TypeScript';
  
  // Extract extension
  const parts = filename.split('.');
  if (parts.length > 1) {
    const extension = parts[parts.length - 1];
    return getLanguageFromExtension(extension);
  }
  
  return null;
}