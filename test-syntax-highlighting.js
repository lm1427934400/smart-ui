// Test to verify optimized syntax highlighting works
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');

// Create MarkdownIt instance with highlighting
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && lang === 'mermaid') {
      // Generate unique ID for mermaid code block
      const id = 'mermaid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      return `<div class="mermaid" data-mermaid-id="${id}">${str}</div>`;
    }
    
    // Handle other code blocks with syntax highlighting
    if (lang) {
      try {
        if (hljs.getLanguage(lang)) {
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
        }
      } catch (__) {
        // If language is not supported, fall back to plain text
      }
    }
    
    // Default: escape HTML and wrap in code tag
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  }
});

// Test content with different languages
const testContent = `
# Test Header

\`\`\`javascript
// This is a comment
function test() {
  const message = 'Hello World';
  console.log(message);
  return 42;
}
\`\`\`

\`\`\`python
# This is a comment
def test():
    message = "Hello World"
    print(message)
    return 42
\`\`\`

\`\`\`java
/* This is a comment */
public class Test {
    public static void main(String[] args) {
        String message = "Hello World";
        System.out.println(message);
        return;
    }
}
\`\`\`

\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`
`;

// Parse the markdown
const htmlContent = md.render(testContent);
console.log('Parsed HTML content:');
console.log(htmlContent);