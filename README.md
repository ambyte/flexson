<h2 align="center">
  <div>
        <a style="color:5dc4f3" href="https://github.com/ambyte/flexson">
            <img src="app/assets/logo.png" width="120" />
            <br>
            Flexson
        </a>
    </div>
    <br>
    The Powerful JSON Data Management Platform
</h2>

<p align="center">
A comprehensive platform for efficient JSON file management with robust authentication, collaborative group workspaces, secure API access, and versatile data endpoints. Flexson streamlines creating, organizing, and sharing JSON data through an intuitive interface while maintaining enterprise-level security and access controls. It is an ideal solution for storing and managing parameters for other services and applications within a company, ensuring seamless integration and centralized configuration management.
</p>

# Features

- 📁 Create, view, edit, and delete JSON files
- 🌐 Public and protected REST API for get and save files
- 🔍 Organize files into groups
- 🔄 Real-time JSON validation and formatting
- 🔐 JWT authentication (register, login, token refresh)
- 🔑 API key generation and management
- 🛡️ Flexible group access (public write, protected by API key)
- 🖥️ Modern UI with Vuetify

## Live Demo

You can test the application at: [https://flexson.vercel.app](https://flexson.vercel.app)

username - flexson_user
password - flexson_password

# Quick Start

### Local

1. Clone the repository and install dependencies (`npm install` or `yarn install`)
2. Start the development server: `npm run dev`
3. The app will be available at http://localhost:3000

### Docker

- Use `docker-compose up -d` to start in containers
- For production: `docker build -t flexson .` and `docker run -d -p 80:80 --name flexson flexson`

### Docker Hub

```
services:
  flexson:
    image: ambyte/flexson:latest
    container_name: flexson-app
    restart: unless-stopped
    ports:
      - "8123:80"
    environment:
      - APP_JWT_SECRET=your_super_secure_jwt_secret_key_change_in_production
      - APP_MONGO_URI=mongodb://admin:password@mongo:27017
      - APP_MONGO_DB=flexsondb
      - APP_ADMIN_USERNAME=admin
      - APP_ADMIN_PASSWORD=1password
      - APP_PUBLIC_DISABLE_REGISTRATION=true
      - APP_PUBLIC_BASE_URL=https://yourwebaddress.com
    depends_on:
      - mongo
    networks:
      - app-network

  mongo:
    image: mongo:latest
    container_name: flexson-db
    restart: unless-stopped
    ports:
      - "27027:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    networks:
      - app-network

volumes:
  mongodb_data:

networks:
  app-network:
    driver: bridge

```

# Architecture

### Frontend

- **Nuxt 3** (Vue 3, TypeScript)
- **Pinia** for state management
- **Vuetify** UI components
- **Components**: JSON editor, file forms, theme toggle, etc.

### Backend

- **Nuxt server routes** (TypeScript)
- **MongoDB** for storing users, files, groups, API keys
- **JWT** for authentication and authorization
- **API keys** for protected group access
- **Public API** for submitting data to groups with public write enabled

# API

If the group is labeled protected, then you must specify the x-api-key with the previously created API key in the request header.

```
x-api-key: "your_api_key"
```

### Public & Protected Group API

- `GET /api/data/{userslug}/{groupslug}` — Get all files in a group (API key required if protected)
- `GET /api/data/{userslug}/{groupslug}/{fileslug}` — Get a specific file from a group (API key required if protected)
- `POST /api/data/{userslug}/{groupslug}` — Submit new JSON or update existing file in a group (if public write is enabled, API key required if protected)

#### Example: Get all files in a group (protected)

```js
fetch("http://localhost:3000/api/data/someuser/team-reports", {
  headers: { "X-API-Key": "<your_api_key>" },
})
  .then((res) => res.json())
  .then(console.log);
```

#### Example: Get a specific file from a group (protected)

```js
fetch("http://localhost:3000/api/data/someuser/team-reports/somefile", {
  headers: { "X-API-Key": "<your_api_key>" },
})
  .then((res) => res.json())
  .then(console.log);
```

### Example: Public submission

```js
const data = {
  name: "Sample Report",
  slug: "sample-report" // optionally
  content: { title: "Weekly", items: [1, 2, 3] },
  description: "Weekly report", // optionally
};
fetch("http://localhost:3000/api/data/someuser/team-reports", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
})
  .then((res) => res.json())
  .then(console.log);
```

#### Submission JSON response

```json
{
  "success": true,
  "message": "Data saved successfully",
  "fileUrl": "http://localhost:3000/api/data/someuser/team-reports/sample-report"
}
```

# License

MIT License
