# 🚀 Fine Categories System - Quick Start Guide

## 5-Minute Integration Guide

### 1. Get All Categories (Load Main Screen)

```javascript
// React Component Example
const [categories, setCategories] = useState([]);
const language = localStorage.getItem('lang') || 'en';

useEffect(() => {
  fetch(`http://localhost:5001/api/fines/categories?language=${language}`)
    .then(r => r.json())
    .then(data => setCategories(data.data));
}, [language]);

// Render
return categories.map(cat => (
  <CategoryButton 
    key={cat.id}
    icon={cat.icon}
    name={cat.name}
    color={cat.color}
    onClick={() => selectCategory(cat.id)}
  />
));
```

### 2. Get Subcategories (On Category Select)

```javascript
const selectCategory = async (categoryId) => {
  const response = await fetch(
    `http://localhost:5001/api/fines/categories/${categoryId}/subcategories?language=${language}`
  );
  const data = await response.json();
  setSubcategories(data.data);
};
```

### 3. Get Fine Types (On Subcategory Select)

```javascript
const selectSubcategory = async (subcategoryId) => {
  const response = await fetch(
    `http://localhost:5001/api/fines/subcategories/${subcategoryId}/types?language=${language}`
  );
  const data = await response.json();
  setFineTypes(data.data);
};
```

### 4. Search for Fines (Optional - Quick Access)

```javascript
const searchFines = async (query) => {
  const response = await fetch(
    `http://localhost:5001/api/fines/search?query=${encodeURIComponent(query)}&language=${language}`
  );
  const data = await response.json();
  return data.data; // Show in dropdown
};
```

---

## 📱 UI Flow Recommendations

### Screen 1: Browse Categories
```
┌─────────────────────────────────┐
│  Select a Fine Type             │
├─────────────────────────────────┤
│  🚗 Traffic & Driving           │
│  👥 Public Behaviour            │
│  🏢 Business & Shop             │
│  🌿 Environment & Property      │
│  📄 Digital & Government        │
│  👷 Labour & Employment         │
└─────────────────────────────────┘
```

### Screen 2: Choose Subcategory
```
┌─────────────────────────────────┐
│  🚗 Traffic & Driving           │
├─────────────────────────────────┤
│  • Speeding                     │
│  • Traffic Signals              │
│  • Parking                      │
│  • Documents & Insurance        │
│  • Vehicle Safety               │
│  • Reckless Driving             │
└─────────────────────────────────┘
```

### Screen 3: Select Fine Type
```
┌─────────────────────────────────┐
│  🚗 Traffic > Speeding          │
├─────────────────────────────────┤
│  □ Speeding 1-20 km/h           │
│    Fine: 200-500 SAR            │
│    Admin Fee: 50 SAR            │
│    Requirements: Photo, ID      │
│                                 │
│  □ Speeding 21-40 km/h          │
│    Fine: 500-1000 SAR           │
│    Admin Fee: 75 SAR            │
│    Requirements: Photo, ID      │
└─────────────────────────────────┘
```

### Screen 4: Fine Details & Pay
```
┌─────────────────────────────────┐
│  Speeding 1-20 km/h             │
├─────────────────────────────────┤
│  Base Fine:      500 SAR        │
│  Admin Fee:      50 SAR         │
│  ────────────────────────       │
│  Total:          550 SAR        │
│                                 │
│  Resolution:                    │
│  ✓ Direct Payment (0 days)      │
│  ○ Court Hearing (30 days)      │
│                                 │
│  Required Documents:            │
│  ☐ Upload ticket photo          │
│  ☐ Upload ID/License            │
│                                 │
│  [Pay Now] [Save for Later]     │
└─────────────────────────────────┘
```

---

## 🔍 Smart Search Implementation

```javascript
import React, { useState, useEffect } from 'react';

export default function FineSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const language = 'en';

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`http://localhost:5001/api/fines/search?query=${query}&language=${language}`)
        .then(r => r.json())
        .then(data => setResults(data.data || []))
        .catch(e => console.error(e));
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query, language]);

  return (
    <div>
      <input 
        type="text"
        placeholder="Search fines... (e.g., 'speeding', 'parking')"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      
      {results.length > 0 && (
        <ul className="search-results">
          {results.map(fine => (
            <li key={fine.id} onClick={() => selectFine(fine.id)}>
              <strong>{fine.name}</strong>
              <span className="category">{fine.category} > {fine.subcategory}</span>
              <span className="price">{fine.feeStructure?.min_fine} SAR</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## 🌍 Language Switching

```javascript
// Store language preference
localStorage.setItem('lang', 'ar'); // or 'en'

// Use in all API calls
const language = localStorage.getItem('lang') || 'en';
const url = `http://localhost:5001/api/fines/categories?language=${language}`;

// UI Language Toggle Button
function LanguageToggle() {
  const toggle = () => {
    const newLang = localStorage.getItem('lang') === 'en' ? 'ar' : 'en';
    localStorage.setItem('lang', newLang);
    window.location.reload(); // Or re-fetch all data
  };

  return (
    <button onClick={toggle}>
      {localStorage.getItem('lang') === 'en' ? 'العربية' : 'English'}
    </button>
  );
}
```

---

## ✨ Visual Styling Tips

### Category Colors
```css
.category-traffic { background-color: #FF6B6B; }      /* 🚗 */
.category-behaviour { background-color: #4ECDC4; }    /* 👥 */
.category-business { background-color: #95E1D3; }     /* 🏢 */
.category-environment { background-color: #90EE90; }  /* 🌿 */
.category-digital { background-color: #FFD93D; }      /* 📄 */
.category-labour { background-color: #6C5CE7; }       /* 👷 */
```

### Icon Display
```jsx
<div className="category-icon" style={{ fontSize: '3em' }}>
  {category.icon}
</div>
```

---

## 📊 API Responses Explained

### Categories Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Traffic & Driving",        // Translated based on ?language=
      "description": "Fines related...",
      "icon": "🚗",                       // Use this for display
      "color": "#FF6B6B",                 // Use for background
      "isDefault": true,                  // Show by default
      "order": 1                          // Sort by this
    }
  ]
}
```

### Subcategories Response
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Speeding",
      "description": "Exceeding speed limits",
      "order": 1
    }
  ]
}
```

### Browse Hierarchy Response
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-id",
      "name": "Traffic & Driving",
      "icon": "🚗",
      "subcategories": [
        {
          "id": "subcat-id",
          "name": "Speeding",
          "fineCount": 3,
          "fineTypes": [
            {
              "id": "fine-id",
              "name": "Speeding 1-20 km/h",
              "description": "Minor speeding"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🧪 Testing Endpoints

### Test English
```bash
curl http://localhost:5001/api/fines/categories?language=en
```

### Test Arabic
```bash
curl http://localhost:5001/api/fines/categories?language=ar
```

### Test Search
```bash
curl "http://localhost:5001/api/fines/search?query=speed&language=en"
```

### Test Hierarchy (Full Tree)
```bash
curl http://localhost:5001/api/fines/browse/all?language=en
```

---

## 🎯 Common Use Cases

### 1. Landing Page - Show Popular Categories
```javascript
const popularCategories = categories.filter(c => c.isDefault);
```

### 2. Search Bar - Autocomplete
```javascript
const matches = await searchFines(userInput);
// Show top 5 results in dropdown
```

### 3. Deep Link - Share Fine Type
```javascript
// URL: /fine/{fineTypeId}
window.location.href = `/fine/${fine.id}`;
```

### 4. Breadcrumb Navigation
```
Home > Traffic & Driving > Speeding > Speeding 1-20 km/h
```

### 5. Mobile - Progressive Loading
```javascript
// Load hierarchy once on app start
// Use local copy for browsing (no network)
// Real-time search only when needed
```

---

## 📦 Error Handling

```javascript
async function fetchFines(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    
    return data.data;
  } catch (error) {
    console.error('Failed to fetch fines:', error);
    // Show user-friendly error
    return [];
  }
}
```

---

## 🚀 Next Steps

1. **Copy** the 4 API fetch patterns above
2. **Style** the UI using provided colors & icons
3. **Implement** breadcrumb navigation
4. **Add** search functionality
5. **Test** with both English & Arabic
6. **Deploy** to production

---

**System is ready to integrate! 🎉**

All endpoints are live at `http://localhost:5001/api/fines/`
