CREATE SCHEMA "public";
CREATE TYPE "user_role" AS ENUM('customer', 'driver', 'restaurant_manager');
CREATE TYPE "order_status" AS ENUM('pending', 'accepted_by_driver', 'ordering_at_restaurant', 'order_ready', 'picked_up', 'on_the_way', 'arrived', 'delivered', 'cancelled', 'no_drivers_available');
CREATE TYPE "payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE "payment_method" AS ENUM('card', 'mobile_money', 'cash');
CREATE TYPE "driver_status" AS ENUM('available', 'busy', 'offline', 'on_delivery');
CREATE ROLE "cloud_admin" WITH SUPERUSER CREATEDB CREATEROLE LOGIN REPLICATION BYPASSRLS;
CREATE ROLE "neon_service" WITH CREATEDB CREATEROLE LOGIN REPLICATION BYPASSRLS;
CREATE ROLE "neon_superuser" WITH CREATEDB CREATEROLE REPLICATION BYPASSRLS;
CREATE ROLE "neondb_owner" WITH CREATEDB CREATEROLE LOGIN REPLICATION BYPASSRLS;
CREATE ROLE "pg_checkpoint";
CREATE ROLE "pg_create_subscription";
CREATE ROLE "pg_database_owner";
CREATE ROLE "pg_execute_server_program";
CREATE ROLE "pg_maintain";
CREATE ROLE "pg_monitor";
CREATE ROLE "pg_read_all_data";
CREATE ROLE "pg_read_all_settings";
CREATE ROLE "pg_read_all_stats";
CREATE ROLE "pg_read_server_files";
CREATE ROLE "pg_signal_backend";
CREATE ROLE "pg_stat_scan_tables";
CREATE ROLE "pg_use_reserved_connections";
CREATE ROLE "pg_write_all_data";
CREATE ROLE "pg_write_server_files";
CREATE ROLE "token_roles";
GRANT INSERT ON "customers" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "customers" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "customers" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "customers" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "customers" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "customers" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "customers" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "delivery_tracking" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "delivery_tracking" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "delivery_tracking" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "delivery_tracking" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "delivery_tracking" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "delivery_tracking" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "delivery_tracking" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "driver_order_queue" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "driver_order_queue" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "driver_order_queue" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "driver_order_queue" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "driver_order_queue" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "driver_order_queue" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "driver_order_queue" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "drivers" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "drivers" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "drivers" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "drivers" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "drivers" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "drivers" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "drivers" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "earnings" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "earnings" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "earnings" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "earnings" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "earnings" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "earnings" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "earnings" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "menu_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "menu_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "menu_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "menu_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "menu_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "menu_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "menu_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "menus" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "menus" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "menus" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "menus" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "menus" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "menus" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "menus" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "notifications" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "notifications" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "notifications" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "notifications" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "notifications" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "notifications" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "notifications" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "order_delivery_verification_attempts" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "order_delivery_verification_attempts" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "order_delivery_verification_attempts" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "order_delivery_verification_attempts" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "order_delivery_verification_attempts" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "order_delivery_verification_attempts" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "order_delivery_verification_attempts" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "order_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "order_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "order_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "order_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "order_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "order_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "order_items" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "orders" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "orders" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "orders" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "orders" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "orders" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "orders" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "orders" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "payments" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "payments" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "payments" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "payments" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "payments" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "payments" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "payments" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "restaurant_managers" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "restaurant_managers" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "restaurant_managers" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "restaurant_managers" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "restaurant_managers" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "restaurant_managers" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "restaurant_managers" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "restaurants" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRIGGER ON "restaurants" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "restaurants" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "restaurants" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "restaurants" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "restaurants" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "restaurants" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "spatial_ref_sys" TO "neon_superuser" WITH GRANT OPTION;
GRANT SELECT ON "spatial_ref_sys" TO "neon_superuser" WITH GRANT OPTION;
GRANT UPDATE ON "spatial_ref_sys" TO "neon_superuser" WITH GRANT OPTION;
GRANT DELETE ON "spatial_ref_sys" TO "neon_superuser" WITH GRANT OPTION;
GRANT TRUNCATE ON "spatial_ref_sys" TO "neon_superuser" WITH GRANT OPTION;
GRANT REFERENCES ON "spatial_ref_sys" TO "neon_superuser" WITH GRANT OPTION;
GRANT TRIGGER ON "spatial_ref_sys" TO "neon_superuser" WITH GRANT OPTION;
GRANT TRIGGER ON "users" TO "neondb_owner" WITH GRANT OPTION;
GRANT REFERENCES ON "users" TO "neondb_owner" WITH GRANT OPTION;
GRANT TRUNCATE ON "users" TO "neondb_owner" WITH GRANT OPTION;
GRANT DELETE ON "users" TO "neondb_owner" WITH GRANT OPTION;
GRANT UPDATE ON "users" TO "neondb_owner" WITH GRANT OPTION;
GRANT SELECT ON "users" TO "neondb_owner" WITH GRANT OPTION;
GRANT INSERT ON "users" TO "neondb_owner" WITH GRANT OPTION;
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL CONSTRAINT "customers_user_id_key" UNIQUE,
	"delivery_addresses" jsonb DEFAULT '[]',
	"current_location" point,
	"default_payment_method" payment_method DEFAULT 'card',
	"favorite_restaurants" uuid[],
	"dietary_preferences" text[],
	"total_orders" integer DEFAULT 0,
	"total_spent" numeric(10, 2) DEFAULT '0.00',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "delivery_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"location" point NOT NULL,
	"accuracy" integer,
	"speed" numeric(5, 2),
	"heading" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "driver_order_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL CONSTRAINT "driver_order_queue_order_id_key" UNIQUE,
	"available_driver_ids" uuid[],
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"expires_at" timestamp with time zone NOT NULL,
	"seen_by_driver_ids" uuid[] DEFAULT '{}',
	"declined_by_driver_ids" uuid[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"completed_at" timestamp with time zone
);
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL CONSTRAINT "drivers_user_id_key" UNIQUE,
	"driver_license_number" varchar(50) CONSTRAINT "drivers_driver_license_number_key" UNIQUE,
	"license_expiry_date" date,
	"vehicle_type" varchar(50),
	"vehicle_registration" varchar(50),
	"vehicle_color" varchar(30),
	"vehicle_model" varchar(50),
	"current_status" driver_status DEFAULT 'offline',
	"current_location" point,
	"last_location_update" timestamp with time zone,
	"is_available" boolean DEFAULT true,
	"working_hours" jsonb,
	"service_radius_km" integer DEFAULT 10,
	"total_deliveries" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '5.00',
	"total_earnings" numeric(10, 2) DEFAULT '0.00',
	"bank_account_details" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "earnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"driver_id" uuid,
	"restaurant_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"commission_percentage" numeric(5, 2),
	"commission_amount" numeric(10, 2),
	"net_amount" numeric(10, 2) NOT NULL,
	"is_paid" boolean DEFAULT false,
	"paid_at" timestamp with time zone,
	"payout_reference" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"menu_id" uuid NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(8, 2) NOT NULL,
	"discounted_price" numeric(8, 2),
	"image_url" text,
	"category" varchar(100),
	"tags" text[],
	"is_available" boolean DEFAULT true,
	"is_popular" boolean DEFAULT false,
	"ingredients" jsonb,
	"customizations" jsonb,
	"calories" integer,
	"preparation_time_minutes" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"is_veg" boolean DEFAULT false
);
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"restaurant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"user_type" user_role NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false,
	"is_sent" boolean DEFAULT false,
	"sent_via" text[],
	"read_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "order_delivery_verification_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"attempted_code" varchar(64),
	"success" boolean DEFAULT false,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(8, 2) NOT NULL,
	"total_price" numeric(10, 2) GENERATED ALWAYS AS (((quantity)::numeric * unit_price)) STORED,
	"special_instructions" text,
	"selected_options" jsonb,
	"allergen_notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "order_items_quantity_check" CHECK ((quantity > 0))
);
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_number" varchar(20) NOT NULL CONSTRAINT "orders_order_number_key" UNIQUE,
	"customer_id" uuid NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"driver_id" uuid,
	"status" order_status DEFAULT 'pending',
	"special_instructions" text,
	"delivery_instructions" text,
	"delivery_address" jsonb NOT NULL,
	"placed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"accepted_at" timestamp with time zone,
	"restaurant_notified_at" timestamp with time zone,
	"ready_for_pickup_at" timestamp with time zone,
	"picked_up_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"driver_acceptance_deadline" timestamp with time zone,
	"subtotal" numeric(10, 2) NOT NULL,
	"delivery_fee" numeric(8, 2) NOT NULL,
	"tax_amount" numeric(8, 2) NOT NULL,
	"tip_amount" numeric(8, 2) DEFAULT '0.00',
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_status" payment_status DEFAULT 'pending',
	"payment_method" payment_method,
	"restaurant_rating" integer,
	"driver_rating" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"verification_code" varchar(32),
	"code_expires_at" timestamp with time zone,
	"code_used_at" timestamp with time zone,
	CONSTRAINT "orders_driver_rating_check" CHECK (((driver_rating >= 1) AND (driver_rating <= 5))),
	CONSTRAINT "orders_restaurant_rating_check" CHECK (((restaurant_rating >= 1) AND (restaurant_rating <= 5)))
);
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL CONSTRAINT "payments_order_id_key" UNIQUE,
	"customer_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"payment_method" payment_method NOT NULL,
	"payment_status" payment_status DEFAULT 'pending',
	"gateway_transaction_id" varchar(255),
	"gateway_response" jsonb,
	"payment_details_encrypted" text,
	"initiated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "restaurant_managers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL CONSTRAINT "restaurant_managers_user_id_key" UNIQUE,
	"restaurant_ids" uuid[],
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"manager_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"cuisine_type" varchar(255),
	"phone_number" varchar(20),
	"email" varchar(255),
	"address" text NOT NULL,
	"location" geometry(point,4326) NOT NULL,
	"delivery_radius_km" integer DEFAULT 5,
	"logo_url" text,
	"cover_image_url" text,
	"gallery_urls" text[],
	"opening_hours" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_accepting_orders" boolean DEFAULT true,
	"preparation_time_minutes" integer DEFAULT 20,
	"average_rating" numeric(3, 2) DEFAULT '5.00',
	"total_ratings" integer DEFAULT 0,
	"total_orders" integer DEFAULT 0,
	"commission_percentage" numeric(5, 2) DEFAULT '15.00',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "spatial_ref_sys" (
	"srid" integer PRIMARY KEY,
	"auth_name" varchar(256),
	"auth_srid" integer,
	"srtext" varchar(2048),
	"proj4text" varchar(2048),
	CONSTRAINT "spatial_ref_sys_srid_check" CHECK (((srid > 0) AND (srid <= 998999)))
);
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL CONSTRAINT "users_email_key" UNIQUE,
	"phone_number" varchar(20) CONSTRAINT "users_phone_number_key" UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"role" user_role NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"profile_image_url" text,
	"is_active" boolean DEFAULT true,
	"email_verified" boolean DEFAULT false,
	"phone_verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "customers_pkey" ON "customers" ("id");
CREATE UNIQUE INDEX "customers_user_id_key" ON "customers" ("user_id");
CREATE INDEX "idx_customers_user_id" ON "customers" ("user_id");
CREATE UNIQUE INDEX "delivery_tracking_pkey" ON "delivery_tracking" ("id");
CREATE INDEX "idx_delivery_tracking_created" ON "delivery_tracking" ("created_at");
CREATE INDEX "idx_delivery_tracking_order" ON "delivery_tracking" ("order_id");
CREATE UNIQUE INDEX "driver_order_queue_order_id_key" ON "driver_order_queue" ("order_id");
CREATE UNIQUE INDEX "driver_order_queue_pkey" ON "driver_order_queue" ("id");
CREATE INDEX "idx_driver_order_queue_active" ON "driver_order_queue" ("is_active");
CREATE INDEX "idx_driver_order_queue_expires" ON "driver_order_queue" ("expires_at");
CREATE UNIQUE INDEX "drivers_driver_license_number_key" ON "drivers" ("driver_license_number");
CREATE UNIQUE INDEX "drivers_pkey" ON "drivers" ("id");
CREATE UNIQUE INDEX "drivers_user_id_key" ON "drivers" ("user_id");
CREATE INDEX "idx_drivers_available" ON "drivers" ("is_available");
CREATE INDEX "idx_drivers_location" ON "drivers" USING gist ("current_location");
CREATE INDEX "idx_drivers_status" ON "drivers" ("current_status");
CREATE INDEX "idx_drivers_user_id" ON "drivers" ("user_id");
CREATE UNIQUE INDEX "earnings_pkey" ON "earnings" ("id");
CREATE INDEX "idx_menu_items_available" ON "menu_items" ("is_available");
CREATE INDEX "idx_menu_items_menu" ON "menu_items" ("menu_id");
CREATE INDEX "idx_menu_items_restaurant" ON "menu_items" ("restaurant_id");
CREATE UNIQUE INDEX "menu_items_pkey" ON "menu_items" ("id");
CREATE UNIQUE INDEX "menus_pkey" ON "menus" ("id");
CREATE INDEX "idx_notifications_created" ON "notifications" ("created_at");
CREATE INDEX "idx_notifications_read" ON "notifications" ("is_read");
CREATE INDEX "idx_notifications_user" ON "notifications" ("user_id");
CREATE UNIQUE INDEX "notifications_pkey" ON "notifications" ("id");
CREATE UNIQUE INDEX "order_delivery_verification_attempts_pkey" ON "order_delivery_verification_attempts" ("id");
CREATE INDEX "idx_order_items_order" ON "order_items" ("order_id");
CREATE UNIQUE INDEX "order_items_pkey" ON "order_items" ("id");
CREATE INDEX "idx_orders_customer" ON "orders" ("customer_id");
CREATE INDEX "idx_orders_driver" ON "orders" ("driver_id");
CREATE INDEX "idx_orders_driver_deadline" ON "orders" ("driver_acceptance_deadline");
CREATE INDEX "idx_orders_placed_at" ON "orders" ("placed_at");
CREATE INDEX "idx_orders_restaurant" ON "orders" ("restaurant_id");
CREATE INDEX "idx_orders_status" ON "orders" ("status");
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders" ("order_number");
CREATE UNIQUE INDEX "orders_pkey" ON "orders" ("id");
CREATE INDEX "idx_payments_customer" ON "payments" ("customer_id");
CREATE INDEX "idx_payments_order" ON "payments" ("order_id");
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments" ("order_id");
CREATE UNIQUE INDEX "payments_pkey" ON "payments" ("id");
CREATE UNIQUE INDEX "restaurant_managers_pkey" ON "restaurant_managers" ("id");
CREATE UNIQUE INDEX "restaurant_managers_user_id_key" ON "restaurant_managers" ("user_id");
CREATE INDEX "idx_restaurants_active" ON "restaurants" ("is_active");
CREATE INDEX "idx_restaurants_location" ON "restaurants" USING gist ("location");
CREATE INDEX "idx_restaurants_manager" ON "restaurants" ("manager_id");
CREATE UNIQUE INDEX "restaurants_pkey" ON "restaurants" ("id");
CREATE UNIQUE INDEX "spatial_ref_sys_pkey" ON "spatial_ref_sys" ("srid");
CREATE INDEX "idx_users_email" ON "users" ("email");
CREATE INDEX "idx_users_phone" ON "users" ("phone_number");
CREATE INDEX "idx_users_role" ON "users" ("role");
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE UNIQUE INDEX "users_phone_number_key" ON "users" ("phone_number");
CREATE UNIQUE INDEX "users_pkey" ON "users" ("id");
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE;
ALTER TABLE "delivery_tracking" ADD CONSTRAINT "delivery_tracking_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
ALTER TABLE "driver_order_queue" ADD CONSTRAINT "driver_order_queue_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL;
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE SET NULL;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE;
ALTER TABLE "menus" ADD CONSTRAINT "menus_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL;
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
ALTER TABLE "restaurant_managers" ADD CONSTRAINT "restaurant_managers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "restaurant_managers"("id") ON DELETE CASCADE;
CREATE VIEW "geography_columns" TABLESPACE public AS (SELECT current_database() AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geography_column, postgis_typmod_dims(a.atttypmod) AS coord_dimension, postgis_typmod_srid(a.atttypmod) AS srid, postgis_typmod_type(a.atttypmod) AS type FROM pg_class c, pg_attribute a, pg_type t, pg_namespace n WHERE t.typname = 'geography'::name AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text));
CREATE VIEW "geometry_columns" TABLESPACE public AS (SELECT current_database()::character varying(256) AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geometry_column, COALESCE(postgis_typmod_dims(a.atttypmod), sn.ndims, 2) AS coord_dimension, COALESCE(NULLIF(postgis_typmod_srid(a.atttypmod), 0), sr.srid, 0) AS srid, replace(replace(COALESCE(NULLIF(upper(postgis_typmod_type(a.atttypmod)), 'GEOMETRY'::text), st.type, 'GEOMETRY'::text), 'ZM'::text, ''::text), 'Z'::text, ''::text)::character varying(30) AS type FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid AND NOT a.attisdropped JOIN pg_namespace n ON c.relnamespace = n.oid JOIN pg_type t ON a.atttypid = t.oid LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(split_part(s.consrc, ''''::text, 2), ')'::text, ''::text) AS type FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%geometrytype(% = %'::text) st ON st.connamespace = n.oid AND st.conrelid = c.oid AND (a.attnum = ANY (st.conkey)) LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text)::integer AS ndims FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%ndims(% = %'::text) sn ON sn.connamespace = n.oid AND sn.conrelid = c.oid AND (a.attnum = ANY (sn.conkey)) LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text), '('::text, ''::text)::integer AS srid FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%srid(% = %'::text) sr ON sr.connamespace = n.oid AND sr.conrelid = c.oid AND (a.attnum = ANY (sr.conkey)) WHERE (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT c.relname = 'raster_columns'::name AND t.typname = 'geometry'::name AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text));