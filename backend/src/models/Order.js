const db = require('../config/database');
const crypto = require('crypto');
const { emitOrderUpdate } = require('../socket');

class Order {
  // Create new order
  static async create(customerId, orderData) {
    const {
      restaurant_id,
      items,
      special_instructions,
      delivery_instructions,
      delivery_address,
      subtotal,
      delivery_fee,
      tax_amount,
      tip_amount = 0
    } = orderData;
    
    // Calculate total
    const total_amount = subtotal + delivery_fee + tax_amount + tip_amount;
    
    // Start transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create order
      const orderQuery = `
        INSERT INTO orders (
          customer_id,
          restaurant_id,
          special_instructions,
          delivery_instructions,
          delivery_address,
          subtotal,
          delivery_fee,
          tax_amount,
          tip_amount,
          total_amount,
          status,
          driver_acceptance_deadline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW() + INTERVAL '150 seconds')
        RETURNING *
      `;
      
      const orderResult = await client.query(orderQuery, [
        customerId,
        restaurant_id,
        special_instructions,
        delivery_instructions,
        JSON.stringify(delivery_address),
        subtotal,
        delivery_fee,
        tax_amount,
        tip_amount,
        total_amount
      ]);
      
      const order = orderResult.rows[0];
      
      // Add order items
      for (const item of items) {
        const itemQuery = `
          INSERT INTO order_items (
            order_id,
            menu_item_id,
            quantity,
            unit_price,
            special_instructions,
            selected_options,
            allergen_notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await client.query(itemQuery, [
          order.id,
          item.menu_item_id,
          item.quantity,
          item.unit_price,
          item.special_instructions,
          JSON.stringify(item.selected_options || {}),
          item.allergen_notes
        ]);
      }
      
      // Add to driver queue WITHOUT populating available_driver_ids
      // Driver queue is created but not activated until manager publishes
      const queueQuery = `
        INSERT INTO driver_order_queue (order_id, expires_at, is_active)
        VALUES ($1, NOW() + INTERVAL '600 seconds', false)
        RETURNING *
      `;
      
      await client.query(queueQuery, [order.id]);
      
      await client.query('COMMIT');
      
      // Emit real-time update - order created but not yet published to drivers
      if (emitOrderUpdate) {
        emitOrderUpdate(order.id, {
          type: 'order_created',
          order,
          status: 'pending',
          message: 'Order created, awaiting manager publication'
        });
      }
      
      return order;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get order by ID
  static async findById(orderId, userId = null, userRole = null) {
    let query = `
      SELECT 
        o.*,
        r.name as restaurant_name,
        r.address as restaurant_address,
        r.phone_number as restaurant_phone,
        r.logo_url as restaurant_logo,
        r.location as restaurant_location, -- Ensure this is selected
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.phone_number as customer_phone,
        u.first_name as driver_first_name,
        u.last_name as driver_last_name,
        u.phone_number as driver_phone,
        u.profile_image_url as driver_image,
        -- FIX: Select specific car details here
        d.vehicle_type as driver_vehicle_type,
        d.vehicle_model as driver_vehicle_model,
        d.vehicle_color as driver_vehicle_color,
        d.vehicle_registration as driver_vehicle_plate,
        d.current_location as driver_location,
        o.verification_code,
        o.code_expires_at,
        o.code_used_at
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN customers cust ON o.customer_id = cust.id
      LEFT JOIN users c ON cust.user_id = c.id
      LEFT JOIN drivers dr ON o.driver_id = dr.id
      LEFT JOIN users u ON dr.user_id = u.id
      LEFT JOIN drivers d ON o.driver_id = d.id
      WHERE o.id = $1
    `;
    
    const params = [orderId];
    
    if (userId && userRole) {
        if (userRole === 'customer') {
        query += ` AND o.customer_id = (SELECT id FROM customers WHERE user_id = $2)`;
        params.push(userId);
        } else if (userRole === 'driver') {
        query += ` AND o.driver_id = (SELECT id FROM drivers WHERE user_id = $2)`;
        params.push(userId);
        } else if (userRole === 'restaurant_manager') {
        query += ` AND o.restaurant_id IN (SELECT id FROM restaurants WHERE manager_id = (SELECT id FROM restaurant_managers WHERE user_id = $2))`;
        params.push(userId);
        }
    }
    
    const result = await db.query(query, params);
    return result.rows[0];
  }

  // Get order items
  static async getOrderItems(orderId) {
    const query = `
      SELECT 
        oi.*,
        mi.name as item_name,
        mi.description as item_description,
        mi.image_url as item_image
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at
    `;
    
    const result = await db.query(query, [orderId]);
    return result.rows;
  }

  static createReadableVerificationCode(length = 8) {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const bytes = crypto.randomBytes(length);
    const code = Array.from(bytes)
      .map((byte) => chars[byte % chars.length])
      .join('');
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  }

  static async generateVerificationCode(orderId) {
    const verificationCode = this.createReadableVerificationCode(8);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const query = `
      UPDATE orders
      SET
        verification_code = $2,
        code_expires_at = $3,
        code_used_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [orderId, verificationCode, expiresAt.toISOString()]);
    const order = result.rows[0];

    if (order && emitOrderUpdate) {
      emitOrderUpdate(order.id, {
        type: 'delivery_code_generated',
        order: {
          id: order.id,
          verification_code: order.verification_code,
          code_expires_at: order.code_expires_at,
          code_used_at: order.code_used_at
        }
      });
    }

    return order;
  }

  static async ensureVerificationCode(orderId) {
    const query = `
      SELECT verification_code, code_expires_at, code_used_at
      FROM orders
      WHERE id = $1
    `;
    const result = await db.query(query, [orderId]);
    const order = result.rows[0];
    const now = new Date();

    if (
      !order ||
      !order.verification_code ||
      !order.code_expires_at ||
      order.code_used_at ||
      new Date(order.code_expires_at) <= now
    ) {
      return this.generateVerificationCode(orderId);
    }

    return order;
  }

  static async logVerificationAttempt(orderId, driverId, attemptedCode, success, reason = null) {
    const query = `
      INSERT INTO order_delivery_verification_attempts (
        order_id,
        driver_id,
        attempted_code,
        success,
        reason
      ) VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(query, [orderId, driverId, attemptedCode, success, reason]);
  }

  static async verifyDeliveryCode(orderId, driverId, code) {
    const client = await db.pool.connect();
    let order;

    try {
      await client.query('BEGIN');
      const selectQuery = `SELECT * FROM orders WHERE id = $1 FOR UPDATE`;
      const selectResult = await client.query(selectQuery, [orderId]);

      if (selectResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      order = selectResult.rows[0];
      const now = new Date();
      const providedCode = String(code || '').trim().toUpperCase();
      const expectedCode = String(order.verification_code || '').trim().toUpperCase();

      if (order.driver_id !== driverId) {
        throw new Error('Not authorized to verify this delivery');
      }

      if (!['on_the_way', 'arrived'].includes(order.status)) {
        throw new Error('Delivery verification is not allowed for this order status');
      }

      if (!order.verification_code) {
        throw new Error('Delivery code not generated for this order');
      }

      if (order.code_used_at) {
        throw new Error('Delivery code has already been used');
      }

      if (!order.code_expires_at || new Date(order.code_expires_at) <= now) {
        throw new Error('Delivery code has expired');
      }

      if (providedCode !== expectedCode) {
        throw new Error('Delivery code did not match');
      }

      const updateQuery = `
        UPDATE orders
        SET
          status = 'delivered',
          delivered_at = CURRENT_TIMESTAMP,
          code_used_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      const updateResult = await client.query(updateQuery, [orderId]);
      const updatedOrder = updateResult.rows[0];

      await client.query(
        `UPDATE drivers SET current_status = 'available', is_available = true WHERE id = $1`,
        [driverId]
      );

      const driverEarnings = Number(order.total_amount) * 0.7;
      const commissionAmount = Number(order.total_amount) * 0.3;

      await client.query(
        `INSERT INTO earnings (order_id, driver_id, restaurant_id, amount, commission_percentage, commission_amount, net_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, driverId, order.restaurant_id, driverEarnings, 30, commissionAmount, driverEarnings]
      );

      await client.query(
        `INSERT INTO order_delivery_verification_attempts (
          order_id,
          driver_id,
          attempted_code,
          success,
          reason
        ) VALUES ($1, $2, $3, $4, $5)`,
        [orderId, driverId, providedCode, true, 'verified']
      );

      await client.query('COMMIT');

      if (emitOrderUpdate) {
        emitOrderUpdate(updatedOrder.id, {
          type: 'delivery_code_verified',
          order: updatedOrder,
          new_status: 'delivered'
        });
      }

      const customerRes = await db.query('SELECT user_id FROM customers WHERE id = $1', [order.customer_id]);
      const customerUserId = customerRes.rows[0]?.user_id;
      if (customerUserId) {
        await this.createNotification(
          customerUserId,
          'customer',
          'Delivery Verified',
          'Your order was verified and marked delivered.',
          'delivery_verified',
          { order_id: orderId }
        );
      }

      return updatedOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      if (order) {
        await db.query(
          `INSERT INTO order_delivery_verification_attempts (
            order_id,
            driver_id,
            attempted_code,
            success,
            reason
          ) VALUES ($1, $2, $3, $4, $5)`,
          [orderId, driverId, String(code || '').trim().toUpperCase(), false, error.message]
        );
      }
      throw error;
    } finally {
      client.release();
    }
  }

  // Manager publishes order to available drivers
  static async publishOrder(orderId, managerId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verify manager owns this order's restaurant
      const authQuery = `
        SELECT o.* FROM orders o
        WHERE o.id = $1
          AND o.restaurant_id IN (
            SELECT id FROM restaurants 
            WHERE manager_id = (SELECT id FROM restaurant_managers WHERE user_id = $2)
          )
          AND o.status = 'pending'
      `;
      
      const authResult = await client.query(authQuery, [orderId, managerId]);
      
      if (authResult.rows.length === 0) {
        throw new Error('Order not found or invalid manager authorization');
      }
      
      const order = authResult.rows[0];
      const restaurantId = order.restaurant_id;
      
      // Get restaurant location
      const restaurantQuery = 'SELECT location FROM restaurants WHERE id = $1';
      const restaurantResult = await client.query(restaurantQuery, [restaurantId]);
      const restaurantLocation = restaurantResult.rows[0].location;
      
      // Safe coordinate extraction
      let lng, lat;
      if (typeof restaurantLocation === 'string' && restaurantLocation.startsWith('0101')) {
        const locQuery = `
          SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
          FROM restaurants WHERE id = $1
        `;
        const locRes = await client.query(locQuery, [restaurantId]);
        lng = locRes.rows[0].lng;
        lat = locRes.rows[0].lat;
      } else {
        [lng, lat] = restaurantLocation.replace(/[()]/g, '').split(',').map(Number);
      }
      
      // Find available drivers near restaurant
      const driversQuery = `
        SELECT d.id
        FROM drivers d
        WHERE d.is_available = true
          AND d.current_status = 'available'
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(d.current_location[0], d.current_location[1]), 4326)::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            10000
          )
      `;
      
      const driversResult = await client.query(driversQuery, [lng, lat]);
      const driverIds = driversResult.rows.map(row => row.id);
      
      // Publish order: activate queue and populate available drivers
      await client.query(
        `UPDATE driver_order_queue 
         SET available_driver_ids = $1, is_active = true, expires_at = NOW() + INTERVAL '150 seconds'
         WHERE order_id = $2`,
        [driverIds.length > 0 ? driverIds : [], orderId]
      );
      
      await client.query('COMMIT');
      
      if (emitOrderUpdate) {
        emitOrderUpdate(orderId, {
          type: 'order_published',
          order,
          available_drivers: driverIds.length
        });
      }
      
      // Get manager user ID for notification
      const managerRes = await db.query(
        'SELECT user_id FROM restaurant_managers WHERE user_id = $1',
        [managerId]
      );
      
      if (managerRes.rows.length > 0) {
        await this.createNotification(
          managerId,
          'restaurant_manager',
          'Order Published',
          `Order has been published to ${driverIds.length} available drivers`,
          'order_published',
          { order_id: orderId, available_drivers: driverIds.length }
        );
      }
      
      return order;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Driver accepts order
  static async acceptOrder(orderId, driverId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const checkQuery = `
        SELECT o.*, q.expires_at
        FROM orders o
        JOIN driver_order_queue q ON o.id = q.order_id
        WHERE o.id = $1 
          AND o.status = 'pending'
          AND q.is_active = true
          AND q.expires_at > NOW()
      `;
      
      const checkResult = await client.query(checkQuery, [orderId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Order no longer available');
      }
      
      const updateQuery = `
        UPDATE orders 
        SET 
          driver_id = $2,
          status = 'accepted_by_driver',
          accepted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [orderId, driverId]);
      const order = updateResult.rows[0];
      
      await client.query(
        `UPDATE drivers SET current_status = 'busy', is_available = false WHERE id = $1`,
        [driverId]
      );
      
      await client.query(
        `UPDATE driver_order_queue SET is_active = false, completed_at = CURRENT_TIMESTAMP WHERE order_id = $1`,
        [orderId]
      );

      // FIX: Get the actual User ID linked to this Customer ID
      const userRes = await client.query(
        'SELECT user_id FROM customers WHERE id = $1', 
        [order.customer_id]
      );
      const customerUserId = userRes.rows[0].user_id;
      
      await client.query('COMMIT');
      
      if (emitOrderUpdate) {
        emitOrderUpdate(order.id, {
            type: 'order_accepted',
            order,
            driver_id: driverId
        });
      }
      
      // FIX: Pass customerUserId instead of order.customer_id
      await this.createNotification(
        customerUserId,
        'customer',
        'Driver Accepted',
        'A driver has accepted your order!',
        'order_accepted',
        { order_id: orderId, driver_id: driverId }
      );
      
      return order;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Driver declines order
  static async declineOrder(orderId, driverId) {
    const query = `
      UPDATE driver_order_queue 
      SET declined_by_driver_ids = COALESCE(declined_by_driver_ids, '{}'::uuid[]) || $2
      WHERE order_id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [orderId, driverId]);
    return result.rows[0];
  }

  // Update order status
  static async updateStatus(orderId, status, driverId = null) {
    const validStatuses = [
      'pending',
      'accepted_by_driver',
      'ordering_at_restaurant',
      'order_ready',
      'picked_up',
      'on_the_way',
      'arrived',
      'delivered',
      'cancelled'
    ];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }
    
    const timestampColumns = {
      'ordering_at_restaurant': 'restaurant_notified_at',
      'order_ready': 'ready_for_pickup_at',
      'picked_up': 'picked_up_at',
      'on_the_way': null, // No specific timestamp
      'arrived': null,
      'delivered': 'delivered_at',
      'cancelled': 'cancelled_at'
    };
    
    let query = `
      UPDATE orders 
      SET 
        status = $2,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    const params = [orderId, status];
    
    if (timestampColumns[status]) {
      query += `, ${timestampColumns[status]} = CURRENT_TIMESTAMP`;
    }
    
    query += ` WHERE id = $1`;
    
    if (driverId) {
      query += ` AND driver_id = $3`;
      params.push(driverId);
    }
    
    query += ` RETURNING *`;
    
    const result = await db.query(query, params);
    const order = result.rows[0];
    
    if (order) {
      if (['on_the_way', 'arrived'].includes(status)) {
        await this.ensureVerificationCode(order.id);
      }

      if (emitOrderUpdate) {
        emitOrderUpdate(order.id, {
            type: 'status_update',
            order,
            new_status: status
        });
      }
      
      if (status === 'delivered') {
        await db.query(
          `UPDATE drivers SET current_status = 'available', is_available = true WHERE id = $1`,
          [driverId]
        );
        
        const driverEarnings = order.total_amount * 0.7; 
        await this.createEarning(order.id, driverId, null, driverEarnings, 30, order.total_amount * 0.3, driverEarnings);
      }
      
      // FIX: Get User ID for notification
      const userRes = await db.query(
        'SELECT user_id FROM customers WHERE id = $1', 
        [order.customer_id]
      );
      const customerUserId = userRes.rows[0]?.user_id;

      if (customerUserId) {
        await this.createNotification(
          customerUserId,
          'customer',
          'Order Update',
          `Your order status has changed to: ${status.replace(/_/g, ' ')}`,
          'status_update',
          { order_id: orderId, status }
        );
      }
    }
    
    return order;
  }

  // Get orders for user based on role
  static async getOrdersByUser(userId, userRole, filters = {}) {
    // ... (paste your existing getOrdersByUser code here)
    let baseQuery = '';
    const params = [];
    
    switch (userRole) {
      case 'customer':
        baseQuery = `
          SELECT o.*, r.logo_url as restaurant_logo, r.name as restaurant_name
          FROM orders o
          JOIN restaurants r ON o.restaurant_id = r.id
          WHERE o.customer_id = (SELECT id FROM customers WHERE user_id = $1)
        `;
        params.push(userId);
        break;
      // ... rest of cases ...
      case 'driver':
        baseQuery = `
          SELECT o.*, r.name as restaurant_name, c.first_name as customer_first_name
          FROM orders o
          JOIN restaurants r ON o.restaurant_id = r.id
          JOIN customers cust ON o.customer_id = cust.id
          JOIN users c ON cust.user_id = c.id
          WHERE o.driver_id = (SELECT id FROM drivers WHERE user_id = $1)
        `;
        params.push(userId);
        break;
      case 'restaurant_manager':
        baseQuery = `
          SELECT o.*, c.first_name as customer_first_name
          FROM orders o
          JOIN customers cust ON o.customer_id = cust.id
          JOIN users c ON cust.user_id = c.id
          WHERE o.restaurant_id IN (
            SELECT id FROM restaurants 
            WHERE manager_id = (SELECT id FROM restaurant_managers WHERE user_id = $1)
          )
        `;
        params.push(userId);
        break;
      default:
        throw new Error('Invalid user role');
    }
    // ... (keep filters logic) ...
    const { status, start_date, end_date, page = 1, limit = 20 } = filters;
    let paramIndex = params.length + 1;
    if (status) { baseQuery += ` AND o.status = $${paramIndex}`; params.push(status); paramIndex++; }
    if (start_date) { baseQuery += ` AND o.created_at >= $${paramIndex}`; params.push(start_date); paramIndex++; }
    if (end_date) { baseQuery += ` AND o.created_at <= $${paramIndex}`; params.push(end_date); paramIndex++; }
    const offset = (page - 1) * limit;
    baseQuery += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    const result = await db.query(baseQuery, params);
    return result.rows;
  }

  static async createNotification(userId, userType, title, body, type, data = {}) {
    const query = `
      INSERT INTO notifications (user_id, user_type, title, body, type, data)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await db.query(query, [userId, userType, title, body, type, JSON.stringify(data)]);
    return result.rows[0];
  }

  static async createEarning(orderId, driverId, restaurantId, amount, commissionPercentage, commissionAmount, netAmount) {
    const query = `
      INSERT INTO earnings (order_id, driver_id, restaurant_id, amount, commission_percentage, commission_amount, net_amount) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const result = await db.query(query, [orderId, driverId, restaurantId, amount, commissionPercentage, commissionAmount, netAmount]);
    return result.rows[0];
  }

  // Check for expired orders (cron job)
  static async processExpiredOrders() {
    const query = `
      UPDATE orders o SET status = 'no_drivers_available', updated_at = CURRENT_TIMESTAMP
      FROM driver_order_queue q WHERE o.id = q.order_id AND q.is_active = true AND q.expires_at <= NOW() AND o.status = 'pending' RETURNING o.*
    `;
    const result = await db.query(query);
    if (result.rows.length > 0) {
      const expiredOrderIds = result.rows.map(row => row.id);
      await db.query(`UPDATE driver_order_queue SET is_active = false WHERE order_id = ANY($1)`, [expiredOrderIds]);
      for (const order of result.rows) {
        // FIX: Get user ID for notification here as well if needed, similar to above
        const userRes = await db.query('SELECT user_id FROM customers WHERE id = $1', [order.customer_id]);
        if(userRes.rows[0]) {
             await this.createNotification(userRes.rows[0].user_id, 'customer', 'No Drivers Available', 'Sorry, no drivers were available.', 'order_expired', { order_id: order.id });
        }
      }
    }
    return result.rows;
  }
}

module.exports = Order;