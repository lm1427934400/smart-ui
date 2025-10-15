// Simple test to verify Markdown syntax highlighting works
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');

// Create MarkdownIt instance with highlighting
const mdInstance = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
      } catch (__) {}
    }
    
    // Default: escape HTML and wrap in code tag
    return `<pre class="hljs"><code>${mdInstance.utils.escapeHtml(str)}</code></pre>`;
  }
});

// Test content with different languages
const testContent = `
# Test Header

\`\`\`javascript
function test() {
  console.log('Hello World');
}
\`\`\`

\`\`\`python
def test():
    print('Hello World')
\`\`\`

\`\`\`java
public class Test {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
\`\`\`
`;

// Parse the markdown
const htmlContent = mdInstance.render(testContent);
console.log('Parsed HTML content:');
console.log(htmlContent);