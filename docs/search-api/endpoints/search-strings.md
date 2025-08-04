# Search Strings: `/search/proxy/getSearchStrings`

Localized UI strings and content facets for building dynamic search interfaces with multi-language support.

## Basic Information

- **Full URL:** `https://www.churchofjesuschrist.org/search/proxy/getSearchStrings`
- **HTTP Method:** `GET`
- **Content-Type:** N/A (GET request with query parameters)
- **Authentication:** None required
- **Rate Limiting:** Unknown
- **Purpose:** Retrieve localized UI strings and content facets for search interfaces

## Parameters

### Required Parameters
```typescript
interface SearchStringsParams {
  lang: string;     // Language code (e.g., "eng", "spa", "fra")
}
```

### Query Parameters
- **`lang`**: Language code for localized strings (e.g., `"eng"` for English)

## Response Format

### Success Response Structure
```typescript
interface SearchStringsResponse {
  strings: {
    // Search UI strings
    noResultsTitle: string;
    noResults: string;
    searchButtonText: string;
    searchInputPlaceholder: string;
    pageTitle: string;
    
    // Content type labels
    allContent: string;
    scriptures: string;
    oldTestament: string;
    newTestament: string;
    bookOfMormon: string;
    doctrineAndCovenants: string;
    pearlOfGreatPrice: string;
    generalConference: string;
    comeFollowMe: string;
    // ... many more content type strings
    
    // Search facets with hierarchical structure
    facets: SearchFacet[];
  };
}

interface SearchFacet {
  resourceBundleKey: string;    // Internal key for the facet
  facetId: string;              // ID used in search filters
  displayText: string;          // Human-readable label
  subFacets: SearchFacet[];     // Nested facets (e.g., scripture books under scriptures)
}
```

### Response Example (Truncated)
```json
{
  "strings": {
    "searchButtonText": "Search",
    "searchInputPlaceholder": "Enter a search term",
    "allContent": "All Content",
    "scriptures": "Scriptures",
    "oldTestament": "Old Testament",
    "facets": [
      {
        "resourceBundleKey": "scriptures",
        "facetId": "scriptures", 
        "displayText": "Scriptures",
        "subFacets": [
          {
            "resourceBundleKey": "oldTestament",
            "facetId": "ot",
            "displayText": "Old Testament"
          },
          {
            "resourceBundleKey": "bookOfMormon", 
            "facetId": "bofm",
            "displayText": "Book of Mormon"
          }
        ]
      }
    ]
  }
}
```

## Code Integration

### JavaScript Implementation
```javascript
// Add to GospelLibraryClient class
async fetchSearchStrings(lang = 'eng') {
  const params = new URLSearchParams({
    lang: lang
  });
  
  const url = `https://www.churchofjesuschrist.org/search/proxy/getSearchStrings?${params}`;
  
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

// Utility methods for working with search strings
getContentTypeFacets(lang = 'eng') {
  return this.fetchSearchStrings(lang).then(response => {
    if (response.error) return [];
    return response.strings.facets || [];
  });
}

getScriptureFacets(lang = 'eng') {
  return this.getContentTypeFacets(lang).then(facets => {
    const scripturesFacet = facets.find(f => f.facetId === 'scriptures');
    return scripturesFacet ? scripturesFacet.subFacets : [];
  });
}

getLocalizedLabel(key, lang = 'eng') {
  return this.fetchSearchStrings(lang).then(response => {
    if (response.error) return key;
    return response.strings[key] || key;
  });
}
```

## Testing Information

### cURL Testing Commands
```bash
# Get search strings in English
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/getSearchStrings?lang=eng"

# Get search strings in Spanish
curl -X GET "https://www.churchofjesuschrist.org/search/proxy/getSearchStrings?lang=spa"
```

## Content Facets Structure

The `facets` array provides a hierarchical structure of content types:

```javascript
// Top-level facets
allContent: "all"
scriptures: "scriptures" 
  └── oldTestament: "ot"
  └── newTestament: "nt" 
  └── bookOfMormon: "bofm"
  └── doctrineAndCovenants: "dc-testament"
  └── pearlOfGreatPrice: "pgp"
  └── studyHelps: "sh"
generalConference: "general-conference"
comeFollowMe: "come-follow-me"
generalHandbook: "general-handbook"
// ... and many more
```

## Usage Examples

### Build Dynamic Search Interface
```javascript
// Get localized strings for search UI
const strings = await client.fetchSearchStrings('spa');

// Build search form
const searchForm = {
  placeholder: strings.strings.searchInputPlaceholder, // "Ingrese un término de búsqueda"
  buttonText: strings.strings.searchButtonText,         // "Buscar"
  noResultsMessage: strings.strings.noResults          // "No se encontraron resultados"
};
```

### Content Type Filtering
```javascript
// Get content type facets for filter dropdown
const facets = await client.getContentTypeFacets('eng');

// Build filter options
const filterOptions = facets.map(facet => ({
  id: facet.facetId,
  label: facet.displayText,
  children: facet.subFacets?.map(sub => ({
    id: sub.facetId,
    label: sub.displayText
  }))
}));
```

### Scripture Collection Filters
```javascript
// Get scripture-specific facets
const scriptureFacets = await client.getScriptureFacets('eng');

// Map to search parameters
const scriptureCollections = scriptureFacets.map(facet => ({
  searchParam: facet.facetId,        // "ot", "nt", "bofm", etc.
  displayName: facet.displayText,    // "Old Testament", "New Testament", etc.
  resourceKey: facet.resourceBundleKey
}));
```

## Multi-Language Support

### Language-Specific UI
```javascript
// Build language-aware search interface
class LocalizedSearchInterface {
  constructor(lang = 'eng') {
    this.lang = lang;
    this.strings = null;
  }
  
  async initialize() {
    const response = await client.fetchSearchStrings(this.lang);
    this.strings = response.strings;
  }
  
  getLabel(key) {
    return this.strings?.[key] || key;
  }
  
  getFacets() {
    return this.strings?.facets || [];
  }
}

// Usage
const spanishUI = new LocalizedSearchInterface('spa');
await spanishUI.initialize();
```

### Facet Mapping
```javascript
// Map facet IDs to localized labels
function createFacetMap(facets, lang) {
  const map = new Map();
  
  function processFacets(facetList) {
    facetList.forEach(facet => {
      map.set(facet.facetId, {
        label: facet.displayText,
        resourceKey: facet.resourceBundleKey
      });
      
      if (facet.subFacets) {
        processFacets(facet.subFacets);
      }
    });
  }
  
  processFacets(facets);
  return map;
}
```

## Integration with Search Endpoints

### Filter Parameter Mapping
```javascript
// Use facet IDs in search requests
const facets = await client.getContentTypeFacets('eng');
const scripturesFacet = facets.find(f => f.facetId === 'scriptures');
const bofmFacet = scripturesFacet.subFacets.find(f => f.facetId === 'bofm');

// Use in scripture search
const results = await client.searchScriptures('faith', {
  collectionName: 'The Book of Mormon'  // Maps to bofmFacet.facetId
});
```

### Content Type Validation
```javascript
// Validate content type parameters
function validateContentType(contentType, facets) {
  const allFacetIds = [];
  
  function collectIds(facetList) {
    facetList.forEach(facet => {
      allFacetIds.push(facet.facetId);
      if (facet.subFacets) {
        collectIds(facet.subFacets);
      }
    });
  }
  
  collectIds(facets);
  return allFacetIds.includes(contentType);
}
```

## Common Issues & Workarounds

| Issue | Symptoms | Workaround |
|-------|----------|------------|
| Invalid language code | Empty or default English response | Use standard language codes (eng, spa, fra, etc.) |
| Missing strings | Some UI strings are undefined | Provide fallback strings or use English as default |
| Facet ID mismatches | Search filters don't work | Use exact facetId values from response |

## Notes

- This endpoint provides **localized UI strings** for building search interfaces
- **Facets array** defines the content hierarchy used in search filters
- **Facet IDs** correspond to collection names used in other search endpoints
- **Scripture sub-facets** match the collection structure from the Scripture Books endpoint
- Useful for building **dynamic search UIs** that adapt to different languages
- **resourceBundleKey** can be used for internal string lookups
- Response includes **comprehensive content type coverage** (16 major facets with sub-categories)
- Essential for creating **professional, localized search interfaces**
- **Cacheable response** - UI strings change infrequently
- Supports **hierarchical content organization** with nested facets

## Related Documentation

- [Scripture Books](scripture-books.md) - Scripture collection structure matches facet hierarchy
- [Scripture Search](scripture-search.md) - Use facet IDs for collection filtering
- [General Conference Search](general-conference-search.md) - Content type filtering with facet IDs