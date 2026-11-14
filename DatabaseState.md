# Database State Documentation

## Overview
The Happy Delivery application uses **PostgreSQL** as its primary database, extended with the **PostGIS** extension for geospatial queries. The database schema is designed to support a three-sided marketplace (customers, drivers, restaurants) with real-time order tracking, secure payments, and location-based services.

## Database Connection
- Connection is managed via a connection pool (`pg` library) configured in `backend/src/config/database.js`.
- Environment variables (including `DATABASE_URL`) are loaded from `.env`.
- SSL is configured for cloud providers (e.g., Neon) with `rejectUnauthorized: false`.

## Custom Data Types (Enums)
The following enumerated types are defined to ensure data integrity:
- `user_role`: `('customer', 'driver', 'restaurant_manager')`
- `order_status`: `('pending', 'accepted_by_driver', 'ordering_at_restaurant', 'order_ready', 'picked_up', 'on_the_way', 'arrived', 'delivered', 'cancelled', 'no_drivers_available')`
- `payment_status`: `('pending', 'processing', 'completed', 'failed', 'refunded')`
- `payment_method`: `('card', 'mobile_money', 'cash')`
- `driver_status`: `('available', 'busy', 'offline', 'on_delivery')`

## Tables and Relationships

### 1. `users`
Stores core authentication and profile information for all users.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| email | VARCHAR(255) | Unique, Not Null |
| phone_number | VARCHAR(20) | Unique |
| password_hash | VARCHAR(255) | Not Null |
| role | user_role | Not Null |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| profile_image_url | TEXT | |
| is_active | BOOLEAN | Default `true` |
| email_verified | BOOLEAN | Default `false` |
| phone_verified | BOOLEAN | Default `false` |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| updated_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

### 2. `customer`
Extends `users` with customer-specific data.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| user_id | UUID | Foreign Key → `users(id)`, Unique, Not Null, On Delete Cascade |
| delivery_addresses | JSONB | Default `'[]'` |
| current_location | POINT | |
| default_payment_method | payment_method | Default `'card'` |
| favorite_restaurants | UUID[] | |
| dietary_preferences | TEXT[] | |
| total_orders | INTEGER | Default `0` |
| total_spent | NUMERIC(10,2) | Default `'0.00'` |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| updated_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

### 3. `driver`
Extends `users` with driver-specific data.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| user_id | UUID | Foreign Key → `users(id)`, Unique, Not Null, On Delete Cascade |
| driver_license_number | VARCHAR(50) | Unique |
| license_expiry_date | DATE | |
| vehicle_type | VARCHAR(50) | |
| vehicle_registration | VARCHAR(50) | |
| vehicle_color | VARCHAR(30) | |
| vehicle_model | VARCHAR(50) | |
| current_status | driver_status | Default `'offline'` |
| current_location | POINT | |
| last_location_update | TIMESTAMP WITH TIME ZONE | |
| is_available | BOOLEAN | Default `true` |
| working_hours | JSONB | |
| service_radius_km | INTEGER | Default `10` |
| total_deliveries | INTEGER | Default `0` |
| average_rating | NUMERIC(3,2) | Default `'5.00'` |
| total_earnings | NUMERIC(10,2) | Default `'0.00'` |
| bank_account_details | JSONB | |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| updated_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

### 4. `restaurant_manager`
Links a user to managed restaurants.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| user_id | UUID | Foreign Key → `users(id)`, Unique, Not Null, On Delete Cascade |
| restaurant_ids | UUID[] | |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| updated_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

### 5. `restaurant`
Stores restaurant information, including geospatial location.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| manager_id | UUID | Foreign Key → `restaurant_managers(id)`, Not Null, On Delete Cascade |
| name | VARCHAR(255) | Not Null |
| description | TEXT | |
| cuisine_type | VARCHAR(255) | |
| phone_number | VARCHAR(20) | |
| email | VARCHAR(255) | |
| address | TEXT | Not Null |
| location | GEOMETRY(POINT, 4326) | Not Null, Indexed with GIST |
| delivery_radius_km | INTEGER | Default `5` |
| logo_url | TEXT | |
| cover_image_url | TEXT | |
| gallery_urls | TEXT[] | |
| opening_hours | TEXT | Not Null |
| is_active | BOOLEAN | Default `true` |
| is_accepting_orders | BOOLEAN | Default `true` |
| preparation_time_minutes | INTEGER | Default `20` |
| average_rating | NUMERIC(3,2) | Default `'5.00'` |
| total_ratings | INTEGER | Default `0` |
| total_orders | INTEGER | Default `0` |
| commission_percentage | NUMERIC(5,2) | Default `'15.00'` |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| updated_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

### 6. `menu`
Represents a menu belonging to a restaurant.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| restaurant_id | UUID | Foreign Key → `restaurants(id)`, Not Null, On Delete Cascade |
| name | VARCHAR(100) | Not Null |
| description | TEXT | |
| is_active | BOOLEAN | Default `true` |
| display_order | INTEGER | Default `0` |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| updated_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

### 7. `menu_item`
Individual items within a menu.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| menu_id | UUID | Foreign Key → `menus(id)`, Not Null, On Delete Cascade |
| restaurant_id | UUID | Foreign Key → `restaurants(id)`, Not Null, On Delete Cascade |
| name | VARCHAR(255) | Not Null |
| description | TEXT | |
| price | NUMERIC(8,2) | Not Null |
| discounted_price | NUMERIC(8,2) | |
| image_url | TEXT | |
| category | VARCHAR(100) | |
| tags | TEXT[] | |
| is_available | BOOLEAN | Default `true` |
| is_popular | BOOLEAN | Default `false` |
| ingredients | JSONB | |
| customizations | JSONB | |
| calories | INTEGER | |
| preparation_time_minutes | INTEGER | |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| updated_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| is_veg | BOOLEAN | Default `false` |

### 8. `order`
Represents a customer's order.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| order_number | VARCHAR(20) | Unique, Not Null |
| customer_id | UUID | Foreign Key → `customers(id)`, Not Null, On Delete Cascade |
| restaurant_id | UUID | Foreign Key → `restaurants(id)`, Not Null, On Delete Cascade |
| driver_id | UUID | Foreign Key → `drivers(id)`, On Delete Set Null |
| status | order_status | Default `'pending'` |
| special_instructions | TEXT | |
| delivery_instructions | TEXT | |
| delivery_address | JSONB | Not Null |
| placed_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| accepted_at | TIMESTAMP WITH TIME ZONE | |
| restaurant_notified_at | TIMESTAMP WITH TIME ZONE | |
| ready_for_pickup_at | TIMESTAMP WITH TIME ZONE | |
| picked_up_at | TIMESTAMP WITH TIME ZONE | |
| delivered_at | TIMESTAMP WITH TIME ZONE | |
| cancelled_at | TIMESTAMP WITH TIME ZONE | |
| driver_acceptance_deadline | TIMESTAMP WITH TIME ZONE | |
| subtotal | NUMERIC(10,2) | Not Null |
| delivery_fee | NUMERIC(8,2) | Not Null |
| tax_amount | NUMERIC(8,2) | Not Null |
| tip_amount | NUMERIC(8,2) | Default `'0.00'` |
| total_amount | NUMERIC(10,2) | Not Null |
| verification_code | VARCHAR(32) | |
| code_expires_at | TIMESTAMP WITH TIME ZONE | |
| code_used_at | TIMESTAMP WITH TIME ZONE | |
| payment_status | payment_status | Default `'pending'` |
| payment_method | payment_method | |
| restaurant_rating | INTEGER | Check constraint between 1 and 5 |
| driver_rating | INTEGER | Check constraint between 1 and 5 |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| updated_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

### 9. `order_item`
Items within an order.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| order_id | UUID | Foreign Key → `orders(id)`, Not Null, On Delete Cascade |
| menu_item_id | UUID | Foreign Key → `menu_items(id)`, Not Null, On Delete Restrict |
| quantity | INTEGER | Not Null, Check > 0 |
| unit_price | NUMERIC(8,2) | Not Null |
| total_price | NUMERIC(10,2) | Generated Always As (`(quantity)::numeric * unit_price`) Stored |
| special_instructions | TEXT | |
| selected_options | JSONB | |
| allergen_notes | TEXT | |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

### 10. `payment`
Payment records for orders.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| order_id | UUID | Foreign Key → `orders(id)`, Unique, Not Null, On Delete Cascade |
| customer_id | UUID | Foreign Key → `customers(id)`, Not Null, On Delete Cascade |
| amount | NUMERIC(10,2) | Not Null |
| currency | VARCHAR(3) | Default `'USD'` |
| payment_method | payment_method | Not Null |
| payment_status | payment_status | Default `'pending'` |
| gateway_transaction_id | VARCHAR(255) | |
| gateway_response | JSONB | |
| payment_details_encrypted | TEXT | |
| initiated_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| completed_at | TIMESTAMP WITH TIME ZONE | |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| updated_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

### 11. `delivery_tracking`
Real-time location updates for deliveries.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| order_id | UUID | Foreign Key → `orders(id)`, Not Null, On Delete Cascade |
| driver_id | UUID | Foreign Key → `drivers(id)`, Not Null, On Delete Cascade |
| location | POINT | Not Null |
| accuracy | INTEGER | |
| speed | NUMERIC(5,2) | |
| heading | INTEGER | |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

### 12. `driver_order_queue`
Manages dispatch of orders to available drivers.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| order_id | UUID | Foreign Key → `orders(id)`, Unique, Not Null, On Delete Cascade |
| available_driver_ids | UUID[] | |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| expires_at | TIMESTAMP WITH TIME ZONE | Not Null |
| seen_by_driver_ids | UUID[] | Default `'{}'` |
| declined_by_driver_ids | UUID[] | Default `'{}'` |
| is_active | BOOLEAN | Default `true` |
| completed_at | TIMESTAMP WITH TIME ZONE | |

### 13. `earnings`
Tracks earnings from orders for drivers and restaurants.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| order_id | UUID | Foreign Key → `orders(id)`, Not Null, On Delete Cascade |
| driver_id | UUID | Foreign Key → `drivers(id)`, On Delete Set Null |
| restaurant_id | UUID | Foreign Key → `restaurants(id)`, On Delete Set Null |
| amount | NUMERIC(10,2) | Not Null |
| commission_percentage | NUMERIC(5,2) | |
| commission_amount | NUMERIC(10,2) | |
| net_amount | NUMERIC(10,2) | Not Null |
| is_paid | BOOLEAN | Default `false` |
| paid_at | TIMESTAMP WITH TIME ZONE | |
| payout_reference | VARCHAR(255) | |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |
| updated_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

### 14. `notifications`
System notifications for users.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| user_id | UUID | Foreign Key → `users(id)`, Not Null, On Delete Cascade |
| user_type | user_role | Not Null |
| title | VARCHAR(255) | Not Null |
| body | TEXT | Not Null |
| type | VARCHAR(50) | Not Null |
| data | JSONB | |
| is_read | BOOLEAN | Default `false` |
| is_sent | BOOLEAN | Default `false` |
| sent_via | TEXT[] | |
| read_at | TIMESTAMP WITH TIME ZONE | |
| sent_at | TIMESTAMP WITH TIME ZONE | |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

### 15. `order_delivery_verification_attempts`
Logs verification code attempts during delivery.
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | Primary Key, default `gen_random_uuid()` |
| order_id | UUID | Foreign Key → `orders(id)`, Not Null, On Delete Cascade |
| driver_id | UUID | Foreign Key → `drivers(id)`, Not Null, On Delete Cascade |
| attempted_code | VARCHAR(64) | |
| success | BOOLEAN | Default `false` |
| reason | TEXT | |
| created_at | TIMESTAMP WITH TIME ZONE | Default `CURRENT_TIMESTAMP` |

## Views
- `geography_columns`: Provides metadata about geography columns (PostGIS standard view).
- `geometry_columns`: Provides metadata about geometry columns (PostGIS standard view).

## Indexes
Beyond primary keys and unique constraints, the following indexes are created for performance:
- **GIST indexes** on spatial columns:
  - `idx_drivers_location` on `drivers(current_location)`
  - `idx_restaurants_location` on `restaurants(location)`
- **Standard B-tree indexes** on frequently queried columns:
  - `idx_customers_user_id`, `idx_drivers_user_id`, `idx_restaurants_manager`
  - `idx_orders_customer`, `idx_orders_restaurant`, `idx_orders_driver`, `idx_orders_status`, `idx_orders_placed_at`
  - `idx_order_items_order`, `idx_order_items_menu`
  - `idx_payments_order`, `idx_payments_customer`
  - `idx_delivery_tracking_order`, `idx_delivery_tracking_created`
  - `idx_driver_order_queue_active`, `idx_driver_order_queue_expires`
  - `idx_menu_items_menu`, `idx_menu_items_restaurant`, `idx_menu_items_available`
  - `idx_notifications_user`, `idx_notifications_read`, `idx_notifications_created`
  - `idx_users_email`, `idx_users_phone`, `idx_users_role`

## How Models Interact with the Database
All models are located in `backend/src/models/` and follow a consistent pattern:
1. Each model imports the database connection pool from `../config/database`.
2. Static methods perform SQL queries using the `db.query(text, params)` method.
3. Queries are parameterized to prevent SQL injection.
4. Methods typically return the first row (`result.rows[0]`) or an array of rows.
5. Transactions are not explicitly used in the current model methods; reliance is on individual statement atomicity or higher-level service logic.

**Example from `User.js`:**
```javascript
static async findByEmail(email) {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await db.query(query, [email]);
  return result.rows[0];
}
```

**Example with spatial query from `Restaurant.js`:**
```javascript
static async search(lat, lng, filters = {}) {
  // ...
  const query = `
    SELECT 
      r.id, r.name, ...,
      ST_Distance(
        r.location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) as distance_meters
    FROM restaurants r
    WHERE r.is_active = true
      AND ST_DWithin(
        r.location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
  `;
  // ...
  const result = await db.query(query, values);
  return result.rows;
}
```

## How Controllers Use the Models
Controllers (in `backend/src/controllers/`) import models and invoke their static methods to fulfill HTTP requests. They handle:
- Request validation (query parameters, body).
- Authentication and authorization (using `req.user` from middleware).
- Business logic orchestration (e.g., checking ownership before updating a resource).
- Response formatting (JSON with `success` and `data` or `error` fields).
- Error handling (try/catch, converting to appropriate HTTP status codes).

**Example from `restaurantController.js`:**
```javascript
exports.searchRestaurants = async (req, res) => {
  try {
    const { lat, lng, cuisine, minRating, maxDistance } = req.query;
    // ... validation
    const filters = { /* ... */ };
    const restaurants = await Restaurant.search(
      parseFloat(lat),
      parseFloat(lng),
      filters
    );
    res.json({ success: true, data: restaurants });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

## Summary
The database schema is robustly designed for a food delivery platform, leveraging PostgreSQL's relational strengths, JSONB for flexible data, arrays for collections, and PostGIS for efficient geospatial queries. The model layer provides a clean abstraction over raw SQL, while controllers orchestrate the flow of data between the API and the database. This architecture ensures data integrity, scalability, and maintainability.