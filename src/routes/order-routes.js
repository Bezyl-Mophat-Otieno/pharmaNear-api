const express = require("express");
const router = express.Router();
const OrdersRepository = require("../db/repositories/order-repository");
const ApiError = require("../utils/ApiError");
const { authenticate, requireAdmin } = require("../middleware/auth");
const paginate = require("../middleware/pagination");
const BusinessRepository = require("../db/repositories/business-repository");

router.post("/", async (req, res, next) => {
  try {
    const { customerInfo, items, paymentMethod } = req.body;

    
    const { name, email, phone, address, notes } = customerInfo;

    if (!email || !name || !phone || !address || !items?.length) {
      throw ApiError.badRequest("Invalid order payload");
    }

    // Group items by business_id
    const itemsByBusiness = await OrdersRepository.groupItemsByBusiness(items);

    if (Object.keys(itemsByBusiness).length === 0) {
      throw ApiError.badRequest("No valid products found in cart");
    }

    // Create separate orders for each business
    const orders = await OrdersRepository.createOrdersForMultipleBusinesses({
      itemsByBusiness,
      customer_fullname: name,
      customer_email: email,
      customer_phone: phone,
      shipping_address: address,
      method_of_payment: paymentMethod,
      notes,
    });

    res.status(201).json({
      success: true,
      message: `${orders.length} order(s) created successfully`,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await OrdersRepository.getOrderById(id);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/user", authenticate, requireAdmin ,async (req, res, next) => {
  try {
    const email = req.query.email
    if (!email) {
      throw ApiError.badRequest("Email query parameter is required");
    }
    const orders = await OrdersRepository.getOrdersByUserEmail(email);

    res.status(200).json({
      success: true,
      message: "User orders retrieved successfully",
      data: orders,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/", authenticate, requireAdmin, paginate, async (req, res, next) => {
  try {
    const { status } = req.query;
    const { page, limit, offset } = req.pagination;
    const [business] = await BusinessRepository.findByOwner(req.user.user_id)
    if(!business) return res.status(404).json({success:false,message:"Business not found"})
    const [orders, total] = await Promise.all([
      OrdersRepository.getAllOrders({
        status,
        businessId: business.business_id,
        limit: parseInt(limit, 10) || 20,
        offset: offset ? parseInt(offset, 10) : (page - 1) * limit,
      }),
      OrdersRepository.countAllOrders({ status, businessId: business.business_id }),
    ]);
    const limitNum = parseInt(limit, 10) || 20;
    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: orders,
      pagination: { page, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) throw new ApiError(400, "Status is required");

    const updatedOrder = await OrdersRepository.updateOrderStatus(id, status);

    if (!updatedOrder) throw new ApiError(404, "Order not found");

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/payment-status", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus) throw new ApiError(400, "Payment status is required");

    const updatedOrder = await OrdersRepository.updateOrderPaymentStatus(id, paymentStatus);

    if (!updatedOrder) throw new ApiError(404, "Order not found");

    res.status(200).json({
      success: true,
      message: "Order payment status updated successfully",
      data: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/cancel", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const cancelledOrder = await OrdersRepository.cancelOrder(id, reason);

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: cancelledOrder,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authenticate, requireAdmin,  async (req, res, next) => {
  try {
    const { id } = req.params;

    await OrdersRepository.deleteOrder(id);

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
