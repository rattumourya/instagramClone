
# Focusgram Application Documentation

This document provides a comprehensive overview of the Focusgram application, covering both functional (what it does) and non-functional (how it's built) aspects.

---

## 1. Functional Documentation (For a Non-Technical Audience)

This section explains the features of Focusgram from a user's perspective.

### 1.1 What is Focusgram?

Focusgram is a modern, web-based social media application designed to be a familiar, user-friendly platform for sharing and interacting with photo and video content. It mimics the core experience of popular social apps like Instagram, providing a focused and intuitive environment for users to connect through visual media.

### 1.2 Key Features for Users

*   **User Authentication:**
    *   **Sign Up:** New users can create a secure account with a unique username, email, and password.
    *   **Log In:** Registered users can log in to access their feed and profile.
    *   **Log Out:** Users can securely end their session.

*   **Content Feed:**
    *   The home page displays a chronological feed of posts from all users in the system, allowing for easy discovery of new content.

*   **Posting and Content Creation:**
    *   Users can create new posts by uploading one or more images or videos.
    *   Each post can include a descriptive caption.
    *   The upload process includes a visual preview of the selected media.

*   **Post Interactions:**
    *   **Liking:** Users can "like" a post, and the like count is updated in real-time.
    *   **Commenting:** Users can add comments to posts.
    *   **Saving:** Users can "save" posts to a private collection for later viewing on their profile.
    *   **Sharing:** Users can easily share a direct link to a specific post.

*   **User Profiles:**
    *   Each user has a dedicated profile page that displays their bio, follower/following counts, and a grid of all their posts.
    *   For users viewing their own profile, a separate tab shows all the posts they have saved.
    *   Users can follow or unfollow other users directly from their profile pages.

*   **Search and Discovery:**
    *   A powerful search bar in the header allows users to find other users by their username or real name.
    *   Search results appear in a clean, real-time popover.

---

## 2. Non-Functional Documentation (For a Technical Audience)

This section details the technical architecture, design choices, and quality attributes of the Focusgram application.

### 2.1 Technology Stack

*   **Framework:** [Next.js](https://nextjs.org/) (v15) with the App Router
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Library:** [React](https://react.dev/) (v18)
*   **UI Components:** [ShadCN UI](https://ui.shadcn.com/) - A collection of beautifully designed, reusable, and accessible components.
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **AI/Generative Features:** [Google Genkit](https://firebase.google.com/docs/genkit)
*   **Form Management:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for schema validation.
*   **Date Formatting:** `date-fns`
*   **Icons:** `lucide-react`

### 2.2 Architecture and Design Patterns

*   **App Router:** The application exclusively uses the Next.js App Router for file-based routing, enabling better code organization, nested layouts, and server-side rendering by default.
*   **Server Components:** Components are React Server Components (RSCs) by default (`"use server"`). Client-side interactivity is explicitly opted into with the `"use client"` directive, optimizing the initial page load by minimizing the client-side JavaScript bundle.
*   **Component-Based Architecture:** The UI is broken down into small, reusable, and encapsulated components located in `src/components`. This includes a distinction between generic UI primitives (`src/components/ui`) and feature-specific components (e.g., `src/components/post`).
*   **State Management:**
    *   Global application state (e.g., current user, posts, users list) is managed centrally through a React Context (`src/context/app-provider.tsx`).
    *   Local component state (e.g., form inputs, dialog visibility) is managed with the `useState` and `useForm` hooks.
*   **Data Fetching & Mocking:** In its current state, the application simulates a backend by loading static data from JSON files (`src/lib/data`). The `AppProvider` is responsible for loading this data and shaping it for the application, simulating a real data-fetching layer.
*   **Styling Strategy:** All styling is handled by Tailwind CSS utility classes. A consistent design system is enforced through the `tailwind.config.ts` and the HSL-based CSS variables defined in `src/app/globals.css`, which are derived from the ShadCN UI theme.

### 2.3 Code Quality and Maintainability

*   **TypeScript:** The entire codebase is strictly typed, reducing runtime errors and improving developer experience.
*   **Code Organization:** The project follows a logical directory structure, separating concerns like AI flows, components, context, data, and library utilities.
*   **Component Reusability:** The use of ShadCN UI provides a strong foundation of generic, high-quality components. Custom components are built with reusability in mind.
*   **Configuration-Driven:** The project utilizes configuration files for defining UI components (`components.json`) and the design system (`tailwind.config.ts`), making it easy to modify and extend.

### 2.4 Performance

*   **Next.js Optimization:** The project leverages built-in Next.js performance optimizations, including Server Components, automatic code splitting, and optimized font loading via `next/font`.
*   **Memoization:** `useMemo` and `useCallback` are used in the `AppProvider` to prevent unnecessary re-renders and expensive recalculations of the posts list.
*   **Lazy Loading:** Images are automatically lazy-loaded by the Next.js `Image` component.

