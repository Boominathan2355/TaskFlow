# Task Flow

A modern, full-stack project management application with a focus on usability and real-time collaboration.

## 🚀 Features

- **Project Dashboard**: View and manage multiple projects.
- **Task Management**: Create, update, and track tasks within projects.
- **Drag and Drop**: Reorder tasks easily using `@dnd-kit`.
- **Rich Text Support**: Write descriptions and notes using Markdown.
- **Authentication**: Secure user login and registration with JWT.
- **File Uploads**: Attach files to projects or tasks.
- **Responsive Design**: Clean and functional UI built with Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
- **React 19**: Core UI framework.
- **Vite**: Fast build tool and dev server.
- **Tailwind CSS**: Utility-first styling.
- **Lucide React**: Beautiful icons.
- **React Router**: Client-side routing.
- **Axios**: API requests.

### Backend
- **Node.js & Express**: Server-side runtime and framework.
- **MongoDB & Mongoose**: NoSQL database and ORM.
- **JSON Web Tokens (JWT)**: Secure authentication.
- **Multer**: Handling multipart/form-data for file uploads.
- **Bcrypt.js**: Password hashing.

## 📋 Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (Local instance or MongoDB Atlas)

## ⚙️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Product
   ```

2. **Install dependencies**:
   
   Root dependencies:
   ```bash
   npm install
   ```

   Client dependencies:
   ```bash
   cd client
   npm install
   cd ..
   ```

   Server dependencies:
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Set up Environment Variables**:
   
   Create a `.env` file in the `server` directory and add your configurations:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

## 🏃 Running the Application

You need to start both the server and the client.

### Start Backend
```bash
cd server
npm run dev
```

### Start Frontend
```bash
cd client
npm run dev
```

## 📂 Project Structure

```text
Product/
├── client/          # React frontend (Vite)
├── server/          # Node.js Express backend
├── .gitignore       # Git ignore rules
├── package.json     # Root level dependencies
└── README.md        # Project documentation
```

## 🚀 Deployment

### Environment Variables

The application uses environment variables to configure the API URL for different environments:

#### Development
- Uses `.env.development` with `VITE_API_URL=http://localhost:5000`
- Automatically loaded when running `npm run dev`

#### Production
- Uses `.env.production` with `VITE_API_URL=` (empty for same-domain deployment)
- Automatically loaded when running `npm run build`

#### Local Overrides
Create a `.env.local` file in the `client` directory for local-specific overrides (this file is gitignored).

### Deploying to Vercel

1. **Push your code to GitHub**

2. **Import project in Vercel**:
   - Connect your GitHub repository
   - Vercel will automatically detect the configuration from `vercel.json`

3. **Configure Backend Environment Variables** in Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `CLIENT_URL`: Your production frontend URL

4. **Deploy**:
   - Vercel will build both frontend and backend
   - Frontend will be served from `/`
   - Backend API will be available at `/api/*`

### Production Build (Local Testing)

To test the production build locally:

```bash
cd client
npm run build
npm run preview
```

This will build the app with production settings and serve it locally to verify the configuration.

## ⚖️ License

This project is licensed under the [ISC License](LICENSE).
