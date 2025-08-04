# Scripture Books: `/search/proxy/scriptureBooks`

Complete listing of all scripture books with localized names and URIs for direct integration with Gospel Library APIs.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/scriptureBooks`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Purpose:** Retrieve complete list of all scripture books with their names and URIs

## Parameters

### Required Parameters
```typescript
interface ScriptureBooksParams {
  lang: string;     // Language code (e.g., "eng", "spa", "fra")
}
```

### Query Parameters
- **`lang`**: Language code for localized book names (e.g., `"eng"` for English)

## Response Format

### Success Response Structure
```typescript
interface ScriptureBooksResponse {
  ot: ScriptureBook[];          // Old Testament books
  nt: ScriptureBook[];          // New Testament books  
  bofm: ScriptureBook[];        // Book of Mormon books
  'dc-testament': ScriptureBook[]; // Doctrine and Covenants + Official Declarations
  pgp: ScriptureBook[];         // Pearl of Great Price books
}

interface ScriptureBook {
  name: string;     // Human-readable book name (localized)
  uri: string;      // Gospel Library URI for the book
}
```

### Response Example (Truncated)
```json
{
  "ot": [
    {
      "name": "Genesis",
      "uri": "/scriptures/ot/gen"
    },
    {
      "name": "Exodus", 
      "uri": "/scriptures/ot/ex"
    }
  ],
  "nt": [
    {
      "name": "Matthew",
      "uri": "/scriptures/nt/matt"
    },
    {
      "name": "Mark",
      "uri": "/scriptures/nt/mark"
    }
  ],
  "bofm": [
    {
      "name": "1 Nephi",
      "uri": "/scriptures/bofm/1-ne"
    },
    {
      "name": "2 Nephi",
      "uri": "/scriptures/bofm/2-ne"
    }
  ],
  "dc-testament": [
    {
      "name": "Doctrine and Covenants 1",
      "uri": "/scriptures/dc-testament/dc/1"
    },
    {
      "name": "Official Declaration 1",
      "uri": "/scriptures/dc-testament/od/1"
    }
  ],
  "pgp": [
    {
      "name": "Moses",
      "uri": "/scriptures/pgp/moses"
    },
    {
      "name": "Abraham",
      "uri": "/scriptures/pgp/abr"
    }
  ]
}
```

## Code Integration

### JavaScript Implementation
```javascript
// Add to GospelLibraryClient class
async fetchScriptureBooks(lang = 'eng') {
  const params = new URLSearchParams({
    lang: lang
  });
  
  const url = `https://www.churchofjesuschrist.org/search/proxy/scriptureBooks?${params}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        error: {
          message: `HTTP error! status: ${response.status}`,
          code: response.status.toString(),
        },
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'FETCH_ERROR',
      },
    };
  }
}

// Utility methods for working with scripture books
getAllScriptureBooks(lang = 'eng') {
  return this.fetchScriptureBooks(lang).then(response => {
    if (response.error) return [];
    
    // Flatten all books into a single array
    return [
      ...response.ot,
      ...response.nt, 
      ...response.bofm,
      ...response['dc-testament'],
      ...response.pgp
    ];
  });
}

findScriptureBook(bookName, lang = 'eng') {
  return this.getAllScriptureBooks(lang).then(books => {
    return books.find(book => 
      book.name.toLowerCase().includes(bookName.toLowerCase()) ||
      book.uri.includes(bookName.toLowerCase())
    );
  });
}

getBooksByCollection(collection, lang = 'eng') {
  return this.fetchScriptureBooks(lang).then(response => {
    if (response.error) return [];
    return response[collection] || [];
  });
}
```

### MCP Tool Integration
```javascript
// Add new scripture books tool to working-server.js
async function handleFetchScriptureBooks(args, messageId) {
  const { lang = 'eng', collection } = args;
  
  try {
    const response = await gospelLibraryClient.fetchScriptureBooks(lang);
    
    if (response.error) {
      sendMessage({
        jsonrpc: "2.0",
        id: messageId,
        result: {
          content: [{
            type: "text",
            text: `Error fetching scripture books: ${response.error.message}`
          }]
        }
      });
      return;
    }

    let resultText = `# Scripture Books (${lang.toUpperCase()})\\n\\n`;
    
    if (collection && response[collection]) {
      // Show specific collection
      const collectionName = {
        'ot': 'Old Testament',
        'nt': 'New Testament', 
        'bofm': 'Book of Mormon',
        'dc-testament': 'Doctrine and Covenants',
        'pgp': 'Pearl of Great Price'
      }[collection] || collection;
      
      resultText += `## ${collectionName} (${response[collection].length} books)\\n\\n`;
      response[collection].forEach((book, index) => {
        resultText += `${index + 1}. **${book.name}**\\n`;
        resultText += `   URI: \`${book.uri}\`\\n\\n`;
      });
    } else {
      // Show all collections
      const collections = [
        { key: 'ot', name: 'Old Testament' },
        { key: 'nt', name: 'New Testament' },
        { key: 'bofm', name: 'Book of Mormon' },
        { key: 'dc-testament', name: 'Doctrine and Covenants' },
        { key: 'pgp', name: 'Pearl of Great Price' }
      ];
      
      collections.forEach(col => {
        if (response[col.key]) {
          resultText += `## ${col.name} (${response[col.key].length} books)\\n`;
          response[col.key].slice(0, 5).forEach(book => {
            resultText += `- **${book.name}** (\`${book.uri}\`)\\n`;
          });
          if (response[col.key].length > 5) {
            resultText += `- ... and ${response[col.key].length - 5} more\\n`;
          }
          resultText += `\\n`;
        }
      });
      
      const totalBooks = Object.values(response).flat().length;
      resultText += `**Total: ${totalBooks} scripture books available**\\n`;
    }

    sendMessage({
      jsonrpc: "2.0",
      id: messageId,
      result: {
        content: [{
          type: "text",
          text: resultText
        }]
      }
    });
  } catch (error) {
    sendMessage({
      jsonrpc: "2.0",
      id: messageId,
      result: {
        content: [{
          type: "text",
          text: `Error: ${error.message}`
        }]
      }
    });
  }
}

// Add to tool definitions array
{
  name: "fetch_scripture_books",
  description: "Get complete list of all scripture books with names and URIs",
  inputSchema: {
    type: "object",
    properties: {
      lang: {
        type: "string",
        description: "Language code (default: 'eng')",
        default: "eng"
      },
      collection: {
        type: "string", 
        description: "Specific scripture collection to retrieve",
        enum: ["ot", "nt", "bofm", "dc-testament", "pgp"]
      }
    }
  }
}
```

## Testing Information

### cURL Testing Commands
```bash
# Get all scripture books in English
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/scriptureBooks?lang=eng"

# Get scripture books in Spanish
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/scriptureBooks?lang=spa"

# Get scripture books in French
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/scriptureBooks?lang=fra"
```

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| Invalid language code | Empty or error response | Use standard language codes (eng, spa, fra, etc.) |
| Missing collections | Some collections absent | Check language support - not all languages have all collections |
| URI encoding | Malformed URIs | URIs are pre-encoded and ready for use with other Gospel Library APIs |

## Scripture Collections

### Collection Breakdown
- **Old Testament (ot)**: 39 books from Genesis to Malachi
- **New Testament (nt)**: 27 books from Matthew to Revelation  
- **Book of Mormon (bofm)**: 15 books from 1 Nephi to Moroni
- **Doctrine and Covenants (dc-testament)**: 138 sections plus 2 Official Declarations
- **Pearl of Great Price (pgp)**: 5 books including Moses, Abraham, Joseph Smith writings, and Articles of Faith

### Collection Keys
```javascript
const collections = {
  'ot': 'Old Testament',
  'nt': 'New Testament',
  'bofm': 'Book of Mormon',
  'dc-testament': 'Doctrine and Covenants',
  'pgp': 'Pearl of Great Price'
};
```

## Usage Examples

### Get All Books
```javascript
// Get all scripture books
const allBooks = await client.fetchScriptureBooks('eng');
console.log(`Total books: ${Object.values(allBooks).flat().length}`);
```

### Get Specific Collection
```javascript
// Get only Book of Mormon books
const bofmBooks = await client.getBooksByCollection('bofm', 'eng');
console.log(`Book of Mormon has ${bofmBooks.length} books`);
```

### Find Specific Book
```javascript
// Find a book by name or URI
const almaBook = await client.findScriptureBook('alma', 'eng');
console.log(`Found: ${almaBook.name} at ${almaBook.uri}`);
```

### Build Navigation
```javascript
// Build scripture navigation interface
const books = await client.fetchScriptureBooks('eng');

// Create navigation menu
const nav = Object.entries(books).map(([collectionKey, books]) => ({
  collection: collectionKey,
  name: collections[collectionKey],
  books: books.map(book => ({
    name: book.name,
    uri: book.uri,
    chapters: [] // Can be populated with chapter URIs
  }))
}));
```

### URI Construction
```javascript
// URIs can be extended for chapter-level access
const book = await client.findScriptureBook('1 nephi', 'eng');
// book.uri = "/scriptures/bofm/1-ne"

// Construct chapter URI
const chapter1Uri = `${book.uri}/1`; // "/scriptures/bofm/1-ne/1"

// Construct verse URI  
const verse3Uri = `${book.uri}/1?verse=3`; // "/scriptures/bofm/1-ne/1?verse=3"
```

## Language Support

### Supported Languages
The endpoint supports multiple languages with localized book names:
- `eng` - English
- `spa` - Spanish  
- `fra` - French
- `por` - Portuguese
- `deu` - German
- And many others...

### Language-Specific Considerations
```javascript
// Different languages may have different availability
const englishBooks = await client.fetchScriptureBooks('eng');
const spanishBooks = await client.fetchScriptureBooks('spa');

// Check for differences
const englishCount = Object.values(englishBooks).flat().length;
const spanishCount = Object.values(spanishBooks).flat().length;

if (englishCount !== spanishCount) {
  console.log('Some collections may not be available in all languages');
}
```

## Integration with Other Endpoints

### Use with Scripture Search
```javascript
// Get valid book names for search filtering
const books = await client.fetchScriptureBooks('eng');
const bookNames = books.bofm.map(book => book.name);

// Use in scripture search
const results = await client.searchScriptures('faith', {
  collectionName: 'The Book of Mormon',
  bookTitle: bookNames[0] // "1 Nephi"
});
```

### Use with Content Fetching
```javascript
// Get book URI and fetch its content
const books = await client.fetchScriptureBooks('eng');
const genesisUri = books.ot.find(book => book.name === 'Genesis').uri;

// Fetch Genesis content
const genesisContent = await client.fetchContent(genesisUri);
```

## Notes

- This endpoint provides the **authoritative list** of all scripture books available in the Gospel Library
- URIs returned can be used directly with other Gospel Library APIs (fetch_content, browse_structure, etc.)
- Book names are **localized** based on the language parameter
- The `dc-testament` collection includes both numbered Doctrine and Covenants sections and Official Declarations
- Total of **218 scripture books/sections** available in English
- Useful for building scripture navigation interfaces, validation, and auto-completion features
- URIs follow consistent patterns that can be used to construct chapter-level URIs (e.g., `/scriptures/bofm/1-ne/1`)
- Response is **cacheable** - book lists rarely change
- Essential for validating user input in scripture-related tools

## Related Documentation

- [Scripture Search](scripture-search.md) - Use book names for precise scripture searching
- [Vertex Search](vertex-search.md) - Multi-type search that includes scripture content
- [General Conference Search](general-conference-search.md) - Conference-specific search with similar filtering