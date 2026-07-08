# ILA Gallery - Artist Community Database

A React + Vite web application built to manage local artist directories, public art pipelines, geospatial opportunity mapping, funding sources, and gallery CRM contacts.

---

## Developer Onboarding & Local Setup

Follow these instructions to set up the project locally on your machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) installed on your system.

### 1. Clone the Repository
```bash
git clone https://github.com/faalali/303-artway-prototype.git
cd 303-artway-prototype
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy the template environment file:
```bash
cp .env.example .env
```
Open `.env` and fill in your Firebase configuration keys (obtained from the Firebase console):
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Run the Development Server
Start the local server at `http://localhost:5173`:
```bash
npm run dev
```

---

## Project Commands

* `npm run dev`: Runs the local development server.
* `npm run build`: Compiles the React production bundle to `dist/`.
* `npm run deploy`: Builds the application and deploys it directly to Firebase Hosting.
* `npx jest firestore.test.js --no-coverage`: Runs unit tests for Firestore security rules.

---

## Deployment to Firebase

### Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Hosting Only
```bash
firebase deploy --only hosting
```
