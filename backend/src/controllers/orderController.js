const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Driver = require('../models/Driver');
const db = require('../config/database');

// Create order
exports.createOrder = async (req, res) => {
  try {
    const customer = await Customer.findByUserId(req.user.id);
    const newOrder = await Order.create(customer.id, req.body);
    const io = req.app.get('io');
    // Notify only managers about the new order; drivers should see it only after publish.
    if (io) {
      const restaurantResult = await db.query('SELECT name FROM restaurants WHERE id = $1', [req.body.restaurant_id]);
      const restaurantName = restaurantResult.rows[0]?.name || 'New order';
      console.log("🔔 Emitting new order notification to managers only...");
      io.to('restaurant_managers').emit('new_order', {
        orderId: newOrder.id,
        restaurantName,
        total: newOrder.total_amount,
        order_number: newOrder.order_number
      });
    }
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get order details
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(
      req.params.id,
      req.user.id,
      req.user.role
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    const items = await Order.getOrderItems(req.params.id);

    if (req.user.role !== 'customer') {
      delete order.verification_code;
      delete order.code_expires_at;
      delete order.code_used_at;
    }
    
    res.json({
      success: true,
      data: {
        ...order,
        items
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get my orders
exports.getMyOrders = async (req, res) => {
  try {
    const { status, start_date, end_date, page, limit } = req.query;
    
    const filters = {
      status,
      start_date,
      end_date,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    };
    
    let orders = await Order.getOrdersByUser(
      req.user.id,
      req.user.role,
      filters
    );

    if (req.user.role !== 'customer') {
      orders = orders.map((order) => {
        const filteredOrder = { ...order };
        delete filteredOrder.verification_code;
        delete filteredOrder.code_expires_at;
        delete filteredOrder.code_used_at;
        return filteredOrder;
      });
    }
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
// Verify delivery code and mark order as delivered
exports.verifyDeliveryCode = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Delivery code is required'
      });
    }

    const order = await Order.verifyDeliveryCode(req.params.id, driver.id, code);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Verify delivery code error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
// Accept order (driver)
exports.acceptOrder = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    
    const order = await Order.acceptOrder(
      req.params.id,
      driver.id
    );
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Decline order (driver)
exports.declineOrder = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    
    const result = await Order.declineOrder(
      req.params.id,
      driver.id
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Decline order error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update order status (driver, manager, or system)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const userRole = req.user.role;
    
    // Get the order first to validate state
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Validate status transitions based on role
    let driver = null;
    let allowed = false;
    
    if (userRole === 'driver') {
      driver = await Driver.findByUserId(req.user.id);
      
      // Drivers can only update orders they accepted
      if (order.driver_id !== driver.id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this order'
        });
      }
      
      // Valid driver transitions: accepted → picked_up → on_the_way → arrived → delivered
      const validDriverTransitions = {
        'accepted_by_driver': ['picked_up', 'on_the_way', 'arrived', 'delivered'],
        'picked_up': ['on_the_way', 'arrived', 'delivered'],
        'on_the_way': ['arrived', 'delivered'],
        'arrived': ['delivered'],
        'delivered': []
      };
      
      if (status === 'delivered') {
        return res.status(400).json({
          success: false,
          error: 'Delivery must be verified with the customer delivery code. Use the Scan Delivery Code action instead.'
        });
      }

      if (validDriverTransitions[order.status]?.includes(status)) {
        allowed = true;
      }
    } else if (userRole === 'restaurant_manager') {
      // Verify manager owns the restaurant
      const managerRes = await db.query(
        `SELECT id FROM restaurant_managers WHERE user_id = $1`,
        [req.user.id]
      );
      
      if (managerRes.rows.length === 0 || order.restaurant_id !== order.restaurant_id) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this order'
        });
      }
      
      // Valid manager transitions: pending → ordering_at_restaurant → order_ready or cancel
      const validManagerTransitions = {
        'pending': ['ordering_at_restaurant', 'cancelled'],
        'ordering_at_restaurant': ['order_ready', 'cancelled'],
        'order_ready': ['picked_up', 'cancelled'],
        'accepted_by_driver': ['ordering_at_restaurant', 'order_ready', 'cancelled']
      };
      
      if (validManagerTransitions[order.status]?.includes(status)) {
        allowed = true;
      }
    }
    
    if (!allowed) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition from ${order.status} to ${status} for ${userRole}`
      });
    }
    
    const updatedOrder = await Order.updateStatus(
      orderId,
      status,
      driver ? driver.id : null
    );
    
    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};