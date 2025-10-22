# 🎯 Fine Categories Browser API

## Overview

The system implements a **three-layer hierarchical structure** for fines:

```
Category (Traffic, Public Behaviour, Business, etc.)
  └─ Subcategory (Speeding, Parking, Smoking, etc.)
       └─ Fine Type (Specific violation with fees and requirements)
```

All endpoints support **bilingual responses** (English/Arabic) via `?language=en` or `?language=ar`.

---

## 📡 API Endpoints

### 1. Get All Categories

Returns all main categories with icons and colors.

**Request:**
```bash
GET /api/fines/categories?language=en
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "Traffic & Driving",
      "description": "Fines related to driving and traffic violations",
      "icon": "🚗",
      "color": "#FF6B6B",
      "isDefault": true,
      "order": 1
    },
    {
      "id": "uuid-2",
      "name": "Public Behaviour",
      "description": "Fines for public conduct, noise, and disturbance issues",
      "icon": "👥",
      "color": "#4ECDC4",
      "isDefault": true,
      "order": 2
    },
    {
      "id": "uuid-3",
      "name": "Business & Shop",
      "description": "Fines for stores, freelancers, and small businesses",
      "icon": "🏢",
      "color": "#95E1D3",
      "isDefault": false,
      "order": 3
    },
    {
      "id": "uuid-4",
      "name": "Environment & Property",
      "description": "Fines for environmental or property-related violations",
      "icon": "🌿",
      "color": "#90EE90",
      "isDefault": false,
      "order": 4
    },
    {
      "id": "uuid-5",
      "name": "Digital & Government",
      "description": "Fines for documentation, permits, and government services",
      "icon": "📄",
      "color": "#FFD93D",
      "isDefault": false,
      "order": 5
    },
    {
      "id": "uuid-6",
      "name": "Labour & Employment",
      "description": "Fines for workplace and labour law violations",
      "icon": "👷",
      "color": "#6C5CE7",
      "isDefault": false,
      "order": 6
    }
  ]
}
```

---

### 2. Get Subcategories for a Category

Returns all subcategories within a main category.

**Request:**
```bash
GET /api/fines/categories/{categoryId}/subcategories?language=en
```

**Example (Traffic & Driving):**
```bash
curl -X GET "http://localhost:5001/api/fines/categories/uuid-1/subcategories"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "subcat-1",
      "name": "Speeding",
      "description": "Exceeding speed limits",
      "order": 1
    },
    {
      "id": "subcat-2",
      "name": "Traffic Signals",
      "description": "Red lights and traffic signal violations",
      "order": 2
    },
    {
      "id": "subcat-3",
      "name": "Parking",
      "description": "Parking and stopping violations",
      "order": 3
    },
    {
      "id": "subcat-4",
      "name": "Documents & Insurance",
      "description": "Expired license, registration, or insurance",
      "order": 4
    },
    {
      "id": "subcat-5",
      "name": "Vehicle Safety",
      "description": "Seatbelts, mirrors, equipment violations",
      "order": 5
    },
    {
      "id": "subcat-6",
      "name": "Reckless Driving",
      "description": "Dangerous or reckless driving",
      "order": 6
    }
  ]
}
```

---

### 3. Get Fine Types for a Subcategory

Returns all fine types with requirements and fee structures.

**Request:**
```bash
GET /api/fines/subcategories/{subcategoryId}/types?language=en
```

**Example (Speeding fines):**
```bash
curl -X GET "http://localhost:5001/api/fines/subcategories/subcat-1/types"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fine-type-1",
      "name": "Speeding 1-20 km/h over limit",
      "description": "Minor speeding violation",
      "category": "Traffic & Driving",
      "feeStructure": {
        "id": "fee-1",
        "fine_type_id": "fine-type-1",
        "min_fine": 200,
        "max_fine": 500,
        "admin_fee": 50,
        "penalty_percentage": 10,
        "late_fee": 100,
        "currency": "SAR"
      },
      "requirements": [
        {
          "id": "req-1",
          "text": "Upload ticket photo or citation",
          "type": "photo",
          "mandatory": true
        },
        {
          "id": "req-2",
          "text": "National ID or Driving License",
          "type": "document",
          "mandatory": true
        }
      ],
      "resolutions": [
        {
          "id": "res-1",
          "method": "Direct Payment",
          "description": "Pay fine directly without court appearance",
          "timeline": 0
        },
        {
          "id": "res-2",
          "method": "Court Hearing",
          "description": "Appear in court to contest the fine",
          "timeline": 30
        }
      ]
    }
  ]
}
```

---

### 4. Smart Search for Fines

Search fines by keyword (supports both English and Arabic keywords).

**Request:**
```bash
GET /api/fines/search?query=speeding&language=en
```

**Examples:**
```bash
# English search
curl -X GET "http://localhost:5001/api/fines/search?query=speeding"

# Arabic search
curl -X GET "http://localhost:5001/api/fines/search?query=سرعة&language=ar"

# Short keyword
curl -X GET "http://localhost:5001/api/fines/search?query=red+light"
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "fine-type-1",
      "name": "Speeding 1-20 km/h over limit",
      "description": "Minor speeding violation",
      "category": "Traffic & Driving",
      "subcategory": "Speeding",
      "feeStructure": { /* ... */ },
      "requirements": [ /* ... */ ]
    },
    {
      "id": "fine-type-2",
      "name": "Speeding 21-40 km/h over limit",
      "description": "Major speeding violation",
      "category": "Traffic & Driving",
      "subcategory": "Speeding",
      "feeStructure": { /* ... */ },
      "requirements": [ /* ... */ ]
    }
  ]
}
```

---

### 5. Get Fine Type Details

Get complete details for a specific fine type.

**Request:**
```bash
GET /api/fines/{fineTypeId}?language=en
```

**Example:**
```bash
curl -X GET "http://localhost:5001/api/fines/fine-type-1"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "fine-type-1",
    "name": "Speeding 1-20 km/h over limit",
    "description": "Minor speeding violation",
    "category": {
      "id": "uuid-1",
      "name": "Traffic & Driving",
      "icon": "🚗",
      "color": "#FF6B6B"
    },
    "subcategory": {
      "id": "subcat-1",
      "name": "Speeding"
    },
    "feeStructure": {
      "id": "fee-1",
      "min_fine": 200,
      "max_fine": 500,
      "admin_fee": 50,
      "penalty_percentage": 10,
      "late_fee": 100,
      "currency": "SAR"
    },
    "requirements": [
      {
        "id": "req-1",
        "text": "Upload ticket photo or citation",
        "type": "photo",
        "mandatory": true
      },
      {
        "id": "req-2",
        "text": "National ID or Driving License",
        "type": "document",
        "mandatory": true
      }
    ],
    "resolutions": [
      {
        "id": "res-1",
        "method": "Direct Payment",
        "description": "Pay fine directly without court appearance",
        "timeline": 0
      },
      {
        "id": "res-2",
        "method": "Court Hearing",
        "description": "Appear in court to contest the fine",
        "timeline": 30
      }
    ]
  }
}
```

---

### 6. Get Complete Browse Hierarchy

Returns entire hierarchy for UI (categories → subcategories → fine types).

**Request:**
```bash
GET /api/fines/browse/all?language=en
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "Traffic & Driving",
      "description": "Fines related to driving and traffic violations",
      "icon": "🚗",
      "color": "#FF6B6B",
      "isDefault": true,
      "subcategories": [
        {
          "id": "subcat-1",
          "name": "Speeding",
          "description": "Exceeding speed limits",
          "fineCount": 5,
          "fineTypes": [
            {
              "id": "fine-type-1",
              "name": "Speeding 1-20 km/h over limit",
              "description": "Minor speeding violation"
            },
            {
              "id": "fine-type-2",
              "name": "Speeding 21-40 km/h over limit",
              "description": "Major speeding violation"
            }
            /* more fine types */
          ]
        },
        {
          "id": "subcat-2",
          "name": "Traffic Signals",
          "description": "Red lights and traffic signal violations",
          "fineCount": 2,
          "fineTypes": [ /* ... */ ]
        }
        /* more subcategories */
      ]
    },
    {
      "id": "uuid-2",
      "name": "Public Behaviour",
      "description": "Fines for public conduct, noise, and disturbance issues",
      "icon": "👥",
      "color": "#4ECDC4",
      "isDefault": true,
      "subcategories": [ /* ... */ ]
    }
    /* more categories */
  ]
}
```

---

## 🎨 Frontend Implementation Tips

### Progressive Disclosure Pattern
1. **First load:** Show only 2-3 main categories (Traffic, Public Behaviour)
2. **On category select:** Load subcategories
3. **On subcategory select:** Load fine types
4. **On fine select:** Show full details

### Smart Search Pattern
- Show search box prominently
- Support keywords like "speeding", "parking", "smoke"
- Show category context in results

### Language Support
- Use `?language=ar` for Arabic responses
- Auto-detect user's language preference
- Bilingual names in UI

### Icon & Color Usage
- Display category icons in tabs/buttons
- Use color codes for visual distinction
- Show category context throughout flow

---

## 🔍 Search Examples

### English Searches
```bash
# Speeding fines
curl -X GET "http://localhost:5001/api/fines/search?query=speed"

# Parking violations
curl -X GET "http://localhost:5001/api/fines/search?query=park"

# Traffic signal violations
curl -X GET "http://localhost:5001/api/fines/search?query=red+light"

# Smoking violations
curl -X GET "http://localhost:5001/api/fines/search?query=smoke"
```

### Arabic Searches
```bash
# السرعة (Speeding)
curl -X GET "http://localhost:5001/api/fines/search?query=سرعة&language=ar"

# التدخين (Smoking)
curl -X GET "http://localhost:5001/api/fines/search?query=تدخين&language=ar"

# المواقف (Parking)
curl -X GET "http://localhost:5001/api/fines/search?query=مواقف&language=ar"
```

---

## 📊 Database Schema

```
fine_categories (6 main categories)
  ├─ fine_subcategories (15+ subcategories)
  │   └─ fine_types (50+ specific violations)
  │       ├─ fine_requirements (what docs needed)
  │       ├─ fine_resolutions (how to resolve)
  │       ├─ fine_search_keywords (search optimization)
  │       └─ fee_structures (pricing per type)
```

---

## ✅ Testing Checklist

- [ ] Get all categories
- [ ] Get subcategories for Traffic & Driving
- [ ] Get fine types for Speeding
- [ ] Search for "speeding"
- [ ] Search for Arabic "سرعة"
- [ ] Get full fine details
- [ ] Test language switching (?language=ar)
- [ ] Get complete hierarchy
- [ ] Verify all categories returned
- [ ] Verify all subcategories count matches

---
