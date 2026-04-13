# Entity Relationship Diagram Reference

## Declaration

```mermaid
erDiagram
```

## Entities

**Simple entity:**
```mermaid
erDiagram
    CUSTOMER
    ORDER
    PRODUCT
```

**Entity with attributes:**
```mermaid
erDiagram
    CUSTOMER {
        int id PK
        string name
        string email UK
        date created_at
    }
```

## Attribute Types

Common types (any string is valid):
- `int`, `integer`, `bigint`
- `string`, `varchar`, `text`
- `bool`, `boolean`
- `date`, `datetime`, `timestamp`
- `float`, `decimal`, `double`
- `uuid`, `json`, `blob`

## Key Constraints

| Constraint | Meaning |
|------------|---------|
| `PK` | Primary Key |
| `FK` | Foreign Key |
| `UK` | Unique Key |

```mermaid
erDiagram
    ORDER {
        int id PK
        int customer_id FK
        string order_number UK
    }
```

## Relationships

**Cardinality notation:**

| Left | Right | Meaning |
|------|-------|---------|
| `\|o` | `o\|` | Zero or one |
| `\|\|` | `\|\|` | Exactly one |
| `}o` | `o{` | Zero or more |
| `}\|` | `\|{` | One or more |

**Relationship syntax:**
```
EntityA <cardinality>--<cardinality> EntityB : "label"
```

**Common patterns:**
```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : "places"
    ORDER ||--|{ LINE_ITEM : "contains"
    PRODUCT ||--o{ LINE_ITEM : "appears in"
    CUSTOMER }|..|{ PRODUCT : "might buy"
```

**Relationship types:**
- `--` Solid line (identifying relationship)
- `..` Dashed line (non-identifying relationship)

## Identifying vs Non-Identifying

**Identifying (solid line):** Child cannot exist without parent
```mermaid
erDiagram
    ORDER ||--|{ ORDER_LINE : contains
```

**Non-Identifying (dashed line):** Child can exist independently
```mermaid
erDiagram
    CATEGORY ||..o{ PRODUCT : categorizes
```

## Relationship Labels

Labels should describe the relationship verb:
- `places`, `contains`, `belongs to`
- `has`, `owns`, `manages`
- `creates`, `updates`, `references`

```mermaid
erDiagram
    USER ||--o{ POST : "creates"
    POST ||--o{ COMMENT : "has"
    USER ||--o{ COMMENT : "writes"
```

## Aliases

```mermaid
erDiagram
    c[CUSTOMER] ||--o{ o[ORDER] : places
```

## Complete Example

```mermaid
erDiagram
    CUSTOMER {
        int id PK
        string first_name
        string last_name
        string email UK
        date created_at
    }

    ORDER {
        int id PK
        int customer_id FK
        string order_number UK
        decimal total
        string status
        datetime ordered_at
    }

    ORDER_LINE {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price
    }

    PRODUCT {
        int id PK
        int category_id FK
        string sku UK
        string name
        text description
        decimal price
        int stock
    }

    CATEGORY {
        int id PK
        int parent_id FK
        string name
        string slug UK
    }

    ADDRESS {
        int id PK
        int customer_id FK
        string type
        string street
        string city
        string postal_code
        string country
    }

    CUSTOMER ||--o{ ORDER : "places"
    CUSTOMER ||--o{ ADDRESS : "has"
    ORDER ||--|{ ORDER_LINE : "contains"
    PRODUCT ||--o{ ORDER_LINE : "included in"
    CATEGORY ||--o{ PRODUCT : "categorizes"
    CATEGORY ||--o{ CATEGORY : "parent of"
```
