# PalettePlate database diagram

Generated from `src/db/schema.ts`. GitHub draws the diagram below automatically.
`PK` is a primary key, `FK` a foreign key, `UK` a unique column. Timestamps and long text columns are left out to keep it readable.

```mermaid
erDiagram
  users ||--o{ sessions : "has"
  users ||--o{ accounts : "has"
  users ||--o{ user_food_preferences : "likes or dislikes"
  foods ||--o{ user_food_preferences : "is rated in"
  users ||--o{ recipes : "writes (admins)"
  recipes ||--o{ recipe_ingredients : "lists"
  foods |o--o{ recipe_ingredients : "optionally matches"
  users ||--o{ favourite_recipes : "saves"
  recipes ||--o{ favourite_recipes : "is saved in"
  users ||--o{ entries : "logs meals"
  entries ||--o{ entry_foods : "contains"
  foods ||--o{ entry_foods : "is eaten in"
  entries ||--o{ entry_recipes : "contains"
  recipes ||--o{ entry_recipes : "is eaten in"
  users ||--o{ posts : "shares"
  recipes |o--o{ posts : "is featured in"
  posts ||--o{ comments : "has"
  users ||--o{ comments : "writes"
  posts ||--o{ reactions : "gets"
  users ||--o{ reactions : "gives"
  users ||--o{ images : "owns"
  posts |o--o{ images : "shows"
  recipes |o--o{ images : "shows"

  users {
    varchar id PK
    varchar name
    varchar email UK
    boolean email_verified
    text image "avatar path"
    enum role "user, moderator, admin"
    varchar region
    varchar gender
    varchar contact_number
  }
  sessions {
    varchar id PK
    varchar token UK
    varchar user_id FK
    timestamp expires_at
  }
  accounts {
    varchar id PK
    varchar user_id FK
    varchar provider_id
    varchar account_id
    text password "Argon2id hash"
  }
  verifications {
    varchar id PK
    varchar identifier
    text value "hashed code"
    timestamp expires_at
  }
  rate_limits {
    varchar id PK
    varchar key UK
    int count
    bigint last_request
  }
  foods {
    varchar id PK
    varchar filipino_name
    varchar english_name
    enum colour
    enum category "fruit, vegetable, grain"
    boolean archived
  }
  user_food_preferences {
    varchar user_id PK, FK
    varchar food_id PK, FK
    enum preference "liked, disliked"
  }
  recipes {
    varchar id PK
    varchar user_id FK
    varchar name
    text description
    text instructions
    enum meal_type
  }
  recipe_ingredients {
    varchar id PK
    varchar recipe_id FK
    varchar food_id FK "nullable"
    varchar section
    int position
    varchar item
    varchar amount
  }
  favourite_recipes {
    varchar user_id PK, FK
    varchar recipe_id PK, FK
  }
  entries {
    varchar id PK
    varchar user_id FK
    enum meal_type
    timestamp eaten_at
  }
  entry_foods {
    varchar entry_id PK, FK
    varchar food_id PK, FK
    enum colour "copied at log time"
    enum category "copied at log time"
  }
  entry_recipes {
    varchar entry_id PK, FK
    varchar recipe_id PK, FK
  }
  posts {
    varchar id PK
    varchar user_id FK
    varchar recipe_id FK "nullable"
    text content
    enum status "draft, pending, approved, rejected"
  }
  comments {
    varchar id PK
    varchar post_id FK
    varchar user_id FK
    text content
  }
  reactions {
    varchar post_id PK, FK
    varchar user_id PK, FK
  }
  images {
    varchar id PK
    varchar owner_id FK
    varchar post_id FK "nullable"
    varchar recipe_id FK "nullable"
    varchar path UK
    varchar mime_type
    int size
  }
```

## Reading it

- **`users` is the hub.** Almost everything a person does hangs off it, and deleting a user cascades to their sessions, meals, posts, comments and hearts. Their uploaded `images` are the exception: those are restricted, so the files are cleaned up first.
- **Food log:** `entries` is one meal. `entry_foods` and `entry_recipes` are its join tables. `entry_foods` copies the food's color and category when logged, so history stays right if a food is later reclassified.
- **Cookbook:** `recipes` are written by admins. `recipe_ingredients` is free text, with an optional link to `foods`.
- **Feed:** `posts` have `comments` and `reactions`. A post's photo is a row in `images` pointing at it, and an avatar is an `images` row with no post, referenced from `users.image`.
- **Standalone tables:** `verifications` (email codes) and `rate_limits` have no foreign keys.
- **Deletes:** A recipe can't be deleted while a meal uses it, and a food can't be deleted while a meal or recipe uses it (`restrict`). A deleted recipe leaves its posts in place (`set null`).
