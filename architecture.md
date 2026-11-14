# Happy Delivery System Architecture

## 1. Overview

Happy Delivery is a full-stack delivery platform built to support three main actors:
- **Customers** placing orders
- **Drivers** accepting and delivering orders
- **Restaurant managers** managing menus, orders, and restaurant operations

The system is designed to deliver real-time order status updates, location-aware driver dispatch, and an integrated dashboard experience for restaurant management.

## 2. Core Business Logic

The primary purpose of the application is to manage an end-to-end food delivery workflow:
1. Customer places an order through the mobile app
2. Backend validates the order, calculates totals, and stores it in PostgreSQL
3. Restaurant managers view and manage incoming orders via a web dashboard
4. Available drivers receive live delivery tasks through Socket.io
5. Drivers update delivery status, which is propagated to customers and managers
6. Payments, notifications, and order history are tracked centrally

Key business concepts:
- Multi-role user management (`customer`, `driver`, `restaurant_manager`)
- Order lifecycle states (`pending`, `accepted_by_driver`, `ordering_at_restaurant`, `picked_up`, `delivered`, etc.)
- Location-aware driver dispatch and tracking
- Menu and restaurant management for managers
- Payment and notification handling for orders

## 3. Tech Stack

### Frontend
- **React Native** / **Expo**
- **expo-router**
- **React Navigation**
- **Axios**
- **Zustand** for local app state
- **Socket.io Client**
- UI libraries:
  - `react-native-paper`
  - `react-native-maps`
  - `expo-location`
  - `expo-notifications`

### Backend
- **Node.js**
- **Express**
- **EJS** for server-rendered manager web views
- **Socket.io** for real-time updates
- **PostgreSQL** via `pg`
- **bcrypt / bcryptjs** for password hashing
- **jsonwebtoken** for JWT-based authentication
- **express-session** and cookies for manager session handling
- **CORS**, **helmet**, **morgan**, **express-rate-limit**, **dotenv**
- **Cloudinary** integration available via `cloudinary` and `multer-storage-cloudinary`

### Database
- **PostgreSQL**
- Schema uses:
  - `uuid` primary IDs
  - JSONB fields for flexible address, metadata, and customization storage
  - ENUM types for roles, order status, payment status, driver status
  - Geospatial location fields (`point`)
- README indicates use of **PostGIS** for geospatial queries

## 4. Directory Structure

### Root
- `README.md`
- `architecture.md`
- `backend/`
- `mobile-app/`
- `APIRouting_EventPipeline.md`
- `DatabaseState.md`

### Backend
- `backend/server.js`
- `backend/package.json`
- `backend/database_schema.sql`
- `backend/public/`
  - Static CSS and JS for web portal
- `backend/routes/`
  - `managerWeb.js`
- `backend/src/`
  - `config/`
    - `cloudinary.js`
    - `database.js`
  - `controllers/`
    - `authController.js`
    - `driverController.js`
    - `managerController.js`
    - `menuController.js`
    - `notificationController.js`
    - `orderController.js`
    - `paymentController.js`
    - `restaurantController.js`
    - `userController.js`
  - `middleware/`
    - `auth.js`
    - `errorHandler.js`
  - `models/`
    - `Customer.js`
    - `Driver.js`
    - `Menu.js`
    - `Order.js`
    - `Payment.js`
    - `Restaurant.js`
    - `RestaurantManager.js`
    - `User.js`
    - `index.js`
  - `routes/`
    - `authRoutes.js`
    - `driverRoutes.js`
    - `managerRoutes.js`
    - `menuRoutes.js`
    - `notificationRoutes.js`
    - `orderRoutes.js`
    - `paymentRoutes.js`
    - `restaurantRoutes.js`
    - `userRoutes.js`
  - `socket/`
    - `index.js`
  - `views/`
    - `manager/`
    - `partials/`

### Mobile App
- `mobile-app/package.json`
- `mobile-app/App.tsx`
- `mobile-app/index.ts`
- `mobile-app/tsconfig.json`
- `mobile-app/app/`
  - Route-based screens via Expo Router
  - `app/(auth)/`
  - `app/(customer)/`
  - `app/(driver)/`
  - `app/(manager)/`
- `mobile-app/components/`
- `mobile-app/constants/`
- `mobile-app/hooks/`
- `mobile-app/services/`
- `mobile-app/store/`

## 5. MVC Pattern Implementation

### Backend MVC Breakdown

#### Models
- `backend/src/models/*`
- Encapsulate database access and CRUD operations
- Example: `User.js`, `Order.js`, `Driver.js`, `Restaurant.js`
- `backend/src/models/index.js` exports model modules

#### Controllers
- `backend/src/controllers/*`
- Implement business logic and orchestration
- Example: `authController.js` validates login/register, creates role-specific profiles, and returns JWT tokens
- Controllers call models and produce JSON responses

#### Views
- `backend/views/*`
- EJS templates for manager portal pages
- Rendered by manager web routes under `/manager`

#### Routes
- `backend/src/routes/*`
- Express routers connect HTTP endpoints to controllers
- Example: `authRoutes.js` maps `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- `backend/routes/managerWeb.js` serves manager-facing UI endpoints

### Supporting Structure
- `backend/src/middleware/*`
  - `auth.js` protects API endpoints
  - `errorHandler.js` centralizes error handling
- `backend/src/config/*`
  - `database.js` configures PostgreSQL connection pool
  - `cloudinary.js` configures image upload service

## 6. Communication and Data Flow

### Mobile App ↔ Backend
- Mobile app uses **REST API** calls for:
  - Authentication
  - Order creation
  - Menu browsing
  - User profile and payment data
  - Notification retrieval
- API base path is `/api/`
- Example endpoints:
  - `/api/auth/login`
  - `/api/orders`
  - `/api/restaurants`
  - `/api/drivers`
  - `/api/menu`
  - `/api/notifications`

### Real-Time Communication
- `backend/server.js` initializes **Socket.io**
- Clients connect using `socket.io-client`
- Socket rooms:
  - `drivers`
  - `restaurant_managers`
- Events shown in backend:
  - `join_driver_room`
  - `join_manager_room`
- This supports push-style updates for:
  - Driver dispatch
  - New order notifications
  - Live delivery status changes

### Manager Web Portal
- Served from the backend via Express + EJS
- Static resources in `backend/public/`
- Manager-side pages use sessions/cookies
- Web routes are separate from API routes

## 7. Microservices and External Services

### Microservices
- No separate Python microservice is present in this workspace
- All server-side business logic is implemented within the Node.js backend

### External Services
- **Cloudinary** is integrated for image upload/storage
- **PostgreSQL** is used as the authoritative data store
- Socket.io enables real-time transport, but no separate service bus or external microservice layer exists

## 8. Summary

Happy Delivery is a **single-backend, multi-client platform** with:
- A Node.js / Express server serving both REST APIs and EJS-based manager views
- A React Native Expo mobile app for customers, drivers, and managers
- A PostgreSQL database with rich domain modeling, including enums, JSONB fields, and geospatial location support
- Real-time coordination using Socket.io
- Clear MVC separation in the backend via `models/`, `controllers/`, `routes/`, and `views/`

This architecture supports modern delivery workflows while keeping the system modular and maintainable.
