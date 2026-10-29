const Driver = require('../models/Driver');
const Order = require('../models/Order');
const db = require('../config/database'); // Required for the raw delivery_tracking SQL queries

// Update driver location
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy, speed } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const driver = await Driver.findByUserId(req.user.id);
    
    // 1. Update the current active location in the drivers table
    const updatedLocation = await Driver.updateLocation(driver.id, lat, lng);
    
    // 2. CRITICAL FIX #3: Persist to delivery_tracking for historical analytics
    await db.query(
      `INSERT INTO delivery_tracking (order_id, driver_id, location, accuracy, speed)
       SELECT o.id, $1, POINT($2, $3), $4, $5
       FROM orders o
       WHERE o.driver_id = $1 AND o.status IN ('accepted_by_driver', 'picked_up', 'on_the_way')`,
      [driver.id, lng, lat, accuracy || null, speed || null]
    );
    
    // 3. CRITICAL FIX #1: Broadcast the live location to the tracking customers
    const io = req.app.get('io');
    if (io) {
      // Find all active orders for this driver to notify the correct rooms
      const orders = await db.query(
        `SELECT id FROM orders WHERE driver_id = $1 AND status IN ('accepted_by_driver', 'picked_up', 'on_the_way', 'arrived')`,
        [driver.id]
      );
      
      // Blast the GPS coordinates directly to the customer's map
      orders.rows.forEach(order => {
        io.to(`order_${order.id}`).emit('driver_location', {
          driverId: driver.id,
          location: [lng, lat],
          accuracy: accuracy,
          speed: speed,
          timestamp: new Date().toISOString()
        });
      });
    }
    
    res.json({
      success: true,
      data: updatedLocation
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update driver status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const driver = await Driver.findByUserId(req.user.id);
    const updatedDriver = await Driver.updateStatus(driver.id, status);
    
    res.json({
      success: true,
      data: updatedDriver
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver profile not found' });
    }

    // Logic for dashboard stats
    const stats = {
      totalEarnings: parseFloat(driver.total_earnings || 0),
      todayEarnings: 0, // You can calculate this from earnings table
      totalDeliveries: parseInt(driver.total_deliveries || 0),
      averageRating: parseFloat(driver.average_rating || 5.0),
      isAvailable: driver.is_available
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get available orders for driver
exports.getAvailableOrders = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    const orders = await Driver.getAvailableOrders(driver.id);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getDriverOrders = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    // Call a new model method to get history
    const orders = await Driver.getOrderHistory(driver.id);
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('❌ Get driver orders error:', error.message);
    res.status(500).json({ success: false, error: 'Server error fetching orders' });
  }
};

exports.updateVehicleInfo = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    const updatedDriver = await Driver.updateVehicleInfo(driver.id, req.body);
    
    res.json({
      success: true,
      data: updatedDriver
    });
  } catch (error) {
    console.error('Update vehicle info error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDriverProfile = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver profile not found' });
    }

    // Convert potential string decimals to actual numbers
    const formattedDriver = {
      ...driver,
      average_rating: parseFloat(driver.average_rating || 0),
      total_earnings: parseFloat(driver.total_earnings || 0)
    };

    res.json({
      success: true,
      data: formattedDriver
    });
  } catch (error) {
    console.error('❌ Get driver profile error:', error.message);
    res.status(500).json({ success: false, error: 'Server error fetching profile' });
  }
};

// Get driver earnings
exports.getEarnings = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const driver = await Driver.findByUserId(req.user.id);
    const earnings = await Driver.getEarnings(
      driver.id,
      start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      end_date || new Date().toISOString()
    );
    
    res.json({
      success: true,
      data: earnings
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get current location
exports.getCurrentLocation = async (req, res) => {
  try {
    const driver = await Driver.findByUserId(req.user.id);
    
    res.json({
      success: true,
      data: {
        location: driver.current_location,
        last_update: driver.last_location_update
      }
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};