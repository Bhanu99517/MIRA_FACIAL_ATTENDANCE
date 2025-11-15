// src/index.tsx

// Import necessary libraries from the React ecosystem.
// 'react' is the core library for building user interfaces.
import React from 'react';
// 'react-dom/client' provides the client-specific rendering methods, like createRoot.
import ReactDOM from 'react-dom/client';
// Import the main App component, which is the root of our component tree.
import App from './App';

// Find the root DOM element where the React application will be mounted.
// This element is defined in the public/index.html file with the id 'root'.
const rootElement = document.getElementById('root');

// A crucial check to ensure the root element exists in the DOM before trying to mount the app.
// If it's not found, we throw an error to fail fast and alert the developer of a configuration issue.
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Create a React root for the target container. This new API enables concurrent features in React.
const root = ReactDOM.createRoot(rootElement);

// Render the application into the root element.
root.render(
  // React.StrictMode is a tool for highlighting potential problems in an application.
  // It activates additional checks and warnings for its descendants. It does not render any visible UI.
  // This is a great practice for development to catch issues early.
  <React.StrictMode>
    {/* The App component is the main component of our application. */}
    <App />
  </React.StrictMode>
);
