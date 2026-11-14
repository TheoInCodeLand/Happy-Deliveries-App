# API Routing and Event Pipeline Documentation

## Overview
This document outlines the API surface and event-driven pipelines of the Happy Delivery backend. The application uses a RESTful API architecture with Express.js for standard HTTP requests and Socket.io for real-time, event-driven communication.

## 1. Route Groupings and Corresponding Controllers

The backend organizes API endpoints into resource-specific route groups, each mapped to a corresponding controller file:

| Route File | Controller File | Base Path | Primary Responsibilities |
|------------|----------------|-----------|--------------------------|
| `authRoutes.js` | `authController.js` | `/api/auth` | User registration, login, and session management |
| `userRoutes.js` | `userController.js` | `/api/users` | Profile updates and role-specific profile management |
| `restaurantRoutes.js` | `restaurantController.js` | `/api/restaurants` | Restaurant management, menu creation, and food search |
| `menuRoutes.js` | `menuController.js` | `/api/menu` | Menu item browsing, filtering, and discovery |
| `orderRoutes.js` | `orderController.js` | `/api/orders` | Order lifecycle management (creation, acceptance, status updates) |
| `paymentRoutes.js` | `paymentController.js` | `/api/payments` | Payment processing and transaction history |
| `driverRoutes.js` | `driverController.js` | `/api/drivers` | Driver location updates, status changes, and earnings |
| `notificationRoutes.js` | `notificationController.js` | `/api/notifications` | User notification retrieval and management |
| `managerRoutes.js` | `managerController.js` | `/api/manager` | Restaurant dashboard analytics and management operations |

### Detailed Route Definitions

#### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Authenticate user and return JWT
- `GET /me` - Get current authenticated user profile (requires auth)

#### User Routes (`/api/users`)
- `PUT /profile` - Update user profile information
- `PUT /role-profile` - Update role-specific profile (vehicle info for drivers, preferences for customers)

#### Restaurant Routes (`/api/restaurants`)
- `GET /search` - Search restaurants by location and filters (public)
- `GET /search/food` - Search food items by name and location (public)
- `POST /` - Create new restaurant (requires restaurant_manager auth)
- `GET /my/restaurants` - Get restaurants managed by current user
- `GET /:id` - Get restaurant details by ID
- `GET /:restaurantId/menus` - Get menus for a restaurant
- `PUT /:id` - Update restaurant details (requires ownership)
- `POST /upload` - Upload image to Cloudinary (requires auth)
- `GET /stats` - Get restaurant performance statistics
- `GET /profile` - Get manager profile
- `POST /:restaurantId/menus` - Create new menu for restaurant
- `POST /:restaurantId/menus/:menuId/items` - Add menu item to menu
- `GET /:restaurantId/menus/:menuId/items/:itemId` - Get specific menu item
- `PUT /:restaurantId/menus/:menuId/items/:itemId` - Update menu item
- `GET /feed/home` - Get home feed for discovery (public)
- `GET /search` - Search food items (public)

#### Menu Routes (`/api/menu`)
- `GET /popular` - Get popular menu items
- `GET /search` - Search menu items by name
- `GET /category/:category` - Get menu items by category

#### Order Routes (`/api/orders`)
- `POST /` - Create new order (requires customer auth)
- `GET /my` - Get orders for current user (customer, driver, or manager)
- `POST /:id/accept` - Accept order by driver (requires driver auth)
- `POST /:id/decline` - Decline order by driver (requires driver auth)
- `PATCH /:id/status` - Update order status (requires driver or manager auth)
- `POST /:id/verify-code` - Verify delivery code (requires driver auth)
- `GET /:id` - Get order details by ID

#### Payment Routes (`/api/payments`)
- `POST /process` - Process payment for order (requires customer auth)
- `GET /my` - Get payment history for current user
- `GET /:order_id` - Get payment details for specific order

#### Driver Routes (`/api/drivers`)
- All routes require driver authentication
- `GET /stats` - Get driver performance statistics
- `GET /orders` - Get driver's order history
- `GET /profile` - Get driver profile
- `GET /available-orders` - Get available orders for driver
- `GET /earnings` - Get driver earnings
- `GET /location` - Get current driver location
- `PUT /location` - Update driver location
- `PUT /status` - Update driver availability status
- `PUT /vehicle` - Update vehicle information

#### Notification Routes (`/api/notifications`)
- All routes require authentication
- `GET /` - Get user notifications with filtering options
- `PATCH /:notification_id/read` - Mark specific notification as read
- `PATCH /mark-all/read` - Mark all notifications as read

#### Manager Routes (`/api/manager`)
- All routes require manager authentication
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /dashboard/revenue` - Get revenue chart data
- `GET /dashboard/orders` - Get orders chart data
- `GET /dashboard/recent-orders` - Get recent orders
- `GET /dashboard/active-orders-count` - Get count of active orders
- `GET /restaurants/my` - Get manager's restaurants with stats
- `GET /orders` - Get all orders for manager's restaurants (with filtering)
- `GET /orders/pending` - Get pending orders for manager's restaurants
- `POST /orders/:id/publish` - Publish order to available drivers

## 2. Asynchronous, Event-Driven Pipelines and WebSocket Handling

The application uses Socket.io for real-time, bidirectional communication between the server and clients. This enables instant updates without requiring clients to poll for changes.

### WebSocket Initialization
- Socket.io is initialized in `server.js` and attached to the HTTP server
- The Socket.io instance is made available to Express via `app.set('io', io)`
- CORS is configured to allow connections from the application domains

### Socket Events and Handlers

#### Connection Events
- `connection` - Triggered when a new client connects
- `disconnect` - Triggered when a client disconnects

#### Room Management Events
Clients join specific rooms to receive targeted broadcasts:

1. **User Rooms**
   - Event: `join` (with userId)
   - Action: Client joins room `user_${userId}`
   - Purpose: Receive user-specific notifications

2. **Driver Rooms**
   - Event: `join_driver` (with driverId)
   - Action: Client joins room `driver_${driverId}`
   - Purpose: Receive driver-specific updates

3. **Order Rooms**
   - Event: `join_order` (with orderId)
   - Action: Client joins room `order_${orderId}`
   - Purpose: Receive real-time updates for a specific order

4. **Global Rooms** (handled in server.js)
   - Event: `join_driver_room`
   - Action: Client joins room `drivers`
   - Purpose: Broadcast to all drivers (new orders)

   - Event: `join_manager_room`
   - Action: Client joins room `restaurant_managers`
   - Purpose: Broadcast to all restaurant managers (new orders)

#### Real-Time Data Events

1. **Driver Location Updates**
   - Event: `driver_location_update` (from driver clients)
   - Data: `{ driverId, orderId, location }`
   - Action: Server broadcasts to `order_${orderId}` room
   - Emitted Event: `driver_location`
   - Data: `{ driverId, location, timestamp }`
   - Purpose: Update order tracking map in real-time

2. **Order Status Updates**
   - Event: `order_status_update` (from various sources)
   - Data: `{ orderId, status, userId }`
   - Action: Server broadcasts to `user_${userId}` room
   - Emitted Event: `order_update`
   - Data: `{ orderId, status, timestamp }`
   - Purpose: Notify customer of order status changes

3. **Order Lifecycle Events** (emitted from Order model via `emitOrderUpdate` helper)
   - Event: `order_created`
     - Triggered: When a new order is created
     - Data: `{ type: 'order_created', order, status: 'pending', message: 'Order created, awaiting manager publication' }`
     - Rooms: Not broadcast (internal use)
   
   - Event: `order_published`
     - Triggered: When a restaurant manager publishes an order to drivers
     - Data: `{ type: 'order_published', order, available_drivers: count }`
     - Rooms: `drivers` (all drivers), `restaurant_managers` (all managers)
     - Purpose: Notify drivers of new available orders; notify managers of publication
   
   - Event: `order_accepted`
     - Triggered: When a driver accepts an order
     - Data: `{ type: 'order_accepted', order, driver_id }`
     - Rooms: `user_${customerUserId}` (customer), `order_${orderId}` (order tracking)
     - Purpose: Notify customer that their order was accepted; update order tracking
   
   - Event: `status_update`
     - Triggered: When an order status changes
     - Data: `{ type: 'status_update', order, new_status }`
     - Rooms: `user_${customerUserId}` (customer), `order_${orderId}` (order tracking)
     - Purpose: Keep customer and order tracking UI in sync with status changes
   
   - Event: `delivery_code_generated`
     - Triggered: When a delivery verification code is generated
     - Data: `{ type: 'delivery_code_generated', order: { id, verification_code, code_expires_at, code_used_at } }`
     - Rooms: `order_${orderId}` (order tracking)
     - Purpose: Update order tracking UI with verification code info
   
   - Event: `delivery_code_verified`
     - Triggered: When a delivery code is successfully verified
     - Data: `{ type: 'delivery_code_verified', order: updatedOrder, new_status: 'delivered' }`
     - Rooms: `user_${customerUserId}` (customer), `order_${orderId}` (order tracking)
     - Purpose: Notify customer of delivery completion; update order tracking

### Event Flow Example
1. Customer places order via `POST /api/orders`
2. Order controller creates order via `Order.create()`
3. Order model emits `order_created` event (internal)
4. Order model emits `order_published` event when manager publishes order
5. Socket.io broadcasts `order_published` to `drivers` room
6. Driver app receives event and displays new order notification
7. Driver accepts order via `POST /api/orders/:id/accept`
8. Order controller updates order via `Order.acceptOrder()`
9. Order model emits `order_accepted` event
10. Socket.io broadcasts to customer's user room and order room
11. Customer app updates UI to show "Driver Accepted"
12. Driver updates location via `PUT /api/drivers/location`
13. Driver app emits `driver_location_update` socket event
14. Server broadcasts driver location to order room
15. Customer app updates map with driver's real-time location
16. Order status updated via `PATCH /api/orders/:id/status`
17. Order model emits `status_update` event
18. Socket.io broadcasts to customer and order rooms
19. Customer app updates status display
20. Delivery code verification via `POST /api/orders/:id/verify-code`
21. Order model emits `delivery_code_verified` event
22. Socket.io broadcasts to customer and order rooms
23. Customer app shows "Delivered" status

## 3. Standard Request/Response Payload Structures

### Request Structure
All API requests follow these patterns:

#### Headers
```
Authorization: Bearer <jwt_token>  // Required for protected routes
Content-Type: application/json     // For POST/PUT/PATCH requests with body
```

#### Query Parameters
Used for filtering, pagination, and sorting:
```
GET /api/orders/my?status=delivered&page=2&limit=10
```

#### Request Body
For POST/PUT/PATCH requests, data is sent as JSON:
```json
{
  "field_name": "value",
  "nested_field": {
    "sub_field": "value"
  }
}
```

### Response Structure
All API responses follow a consistent format:

#### Success Response
```json
{
  "success": true,
  "data": {
    // Resource-specific data
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": [
    // Array of resources
  ],
  "total": 100,
  "totalPages": 5,
  "currentPage": 1,
  "itemsPerPage": 10
}
```

### Specific Endpoint Payload Examples

#### Authentication
**Request (POST /api/auth/login)**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer",
    "token": "jwt_token_here"
  }
}
```

#### Order Creation
**Request (POST /api/orders)**
```json
{
  "restaurant_id": "uuid",
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2,
      "unit_price": 12.99,
      "special_instructions": "Extra sauce",
      "selected_options": { "size": "large" }
    }
  ],
  "special_instructions": "Leave at door",
  "delivery_instructions": "Ring doorbell",
  "delivery_address": {
    "street": "123 Main St",
    "city": "Anytown",
    "zip_code": "12345"
  },
  "subtotal": 25.98,
  "delivery_fee": 3.99,
  "tax_amount": 2.00,
  "tip_amount": 5.00
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": "ORD-123456",
    "customer_id": "uuid",
    "restaurant_id": "uuid",
    "status": "pending",
    "subtotal": 25.98,
    "delivery_fee": 3.99,
    "tax_amount": 2.00,
    "tip_amount": 5.00,
    "total_amount": 36.97,
    "created_at": "2026-05-19T10:30:00Z",
    "updated_at": "2026-05-19T10:30:00Z"
  }
}
```

#### Restaurant Search
**Request (GET /api/restaurants/search?lat=40.7128&lng=-74.0060&cuisine=Italian&maxDistance=5)**
**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Tony's Italian Restaurant",
      "description": "Authentic Italian cuisine",
      "cuisine_type": ["Italian"],
      "longitude": -74.0055,
      "latitude": 40.7130,
      "distance_meters": 320.5,
      "logo_url": "https://example.com/logo.png",
      "cover_image_url": "https://example.com/cover.jpg",
      "opening_hours": "Mon-Sun: 11:00-22:00",
      "preparation_time_minutes": 25
    }
  ]
}
```

#### WebSocket Events
**Client-to-Server**
```
// Join user room
socket.emit('join', 'user_uuid_here');

// Join order room for tracking
socket.emit('join_order', 'order_uuid_here');

// Driver location update
socket.emit('driver_location_update', {
  driverId: 'driver_uuid_here',
  orderId: 'order_uuid_here',
  location: [longitude, latitude]
});

// Order status update (from internal processes)
socket.emit('order_status_update', {
  orderId: 'order_uuid_here',
  status: 'out_for_delivery',
  userId: 'customer_uuid_here'
});
```

**Server-to-Client**
```
// New order notification (to drivers)
socket.to('drivers').emit('new_order', {
  orderId: 'order_uuid_here',
  restaurantName: "Tony's Italian Restaurant",
  total: 36.97,
  order_number: "ORD-123456"
});

// Order status update (to customer)
socket.to('user_customer_uuid_here').emit('order_update', {
  orderId: 'order_uuid_here',
  status: 'out_for_delivery',
  timestamp: '2026-05-19T10:45:00Z'
});

// Driver location (to order tracking)
socket.to('order_order_uuid_here').emit('driver_location', {
  driverId: 'driver_uuid_here',
  location: [longitude, latitude],
  timestamp: '2026-05-19T10:45:00Z'
});

// Delivery code verification (to customer and order tracking)
socket.to('user_customer_uuid_here').emit('order_update', {
  orderId: 'order_uuid_here',
  status: 'delivered',
  timestamp: '2026-05-19T11:00:00Z'
});

socket.to('order_order_uuid_here').emit('order_update', {
  orderId: 'order_uuid_here',
  status: 'delivered',
  timestamp: '2026-05-19T11:00:00Z'
});
```