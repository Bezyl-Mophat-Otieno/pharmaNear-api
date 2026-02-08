const express = require("express");
const router = express.Router();
const TransactionRepository = require("../db/repositories/transaction-repository");
const ApiError = require("../utils/ApiError");
const { authenticate, requireAdmin } = require("../middleware/auth");
const paginate = require("../middleware/pagination");

// Create a new transaction
router.post("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      orderId,
      customerFullname,
      customerEmail,
      customerPhone,
      methodOfPayment,
      transactionType,
      totalAmount,
      totalAmountReceived,
      notes
    } = req.body;

    if (!orderId || !customerFullname || !customerEmail || !totalAmount) {
      throw new ApiError(400, "Missing required fields");
    }

    const receivedBy = req.user.user_id;

    const transaction = await TransactionRepository.createTransaction({
      orderId,
      customerFullname,
      customerEmail,
      customerPhone,
      methodOfPayment,
      transactionType,
      totalAmount,
      totalAmountReceived,
      receivedBy,
      notes
    });

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (err) {
    next(err);
  }
});

// Get all transactions with filtering
router.get("/", authenticate, requireAdmin, paginate, async (req, res, next) => {
  try {
    const { status, transactionType, methodOfPayment } = req.query;
    const { limit, offset } = req.pagination;

    const transactions = await TransactionRepository.getAllTransactions({
      status,
      transactionType,
      methodOfPayment,
      limit: parseInt(limit, 10) || 20,
      offset: parseInt(offset, 10) || 0,
    });

    res.status(200).json({
      success: true,
      message: "Transactions retrieved successfully",
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
});

// Get transaction by ID
router.get("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await TransactionRepository.getTransactionById(id);

    if (!transaction) {
      throw new ApiError(404, "Transaction not found");
    }

    res.status(200).json({
      success: true,
      message: "Transaction retrieved successfully",
      data: transaction,
    });
  } catch (err) {
    next(err);
  }
});

// Get transactions by order ID
router.get("/order/:orderId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const transactions = await TransactionRepository.getTransactionsByOrderId(orderId);

    res.status(200).json({
      success: true,
      message: "Order transactions retrieved successfully",
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
});

// Update transaction status
router.patch("/:id/status", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new ApiError(400, "Status is required");
    }

    const updatedTransaction = await TransactionRepository.updateTransactionStatus(id, status);

    if (!updatedTransaction) {
      throw new ApiError(404, "Transaction not found");
    }

    res.status(200).json({
      success: true,
      message: "Transaction status updated successfully",
      data: updatedTransaction,
    });
  } catch (err) {
    next(err);
  }
});

// Reconcile transaction
router.patch("/:id/reconcile", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const reconciledBy = req.user.user_id; // Get from authenticated user

    const reconciledTransaction = await TransactionRepository.reconcileTransaction(
      id,
      reconciledBy,
      notes
    );

    res.status(200).json({
      success: true,
      message: "Transaction reconciled successfully",
      data: reconciledTransaction,
    });
  } catch (err) {
    next(err);
  }
});

// Create refund transaction
router.post("/:id/refund", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { refundAmount, reason } = req.body;
    const refundedBy = req.user.username || req.user.email; // Get from authenticated user

    if (!refundAmount || !reason) {
      throw new ApiError(400, "Refund amount and reason are required");
    }

    const refundTransaction = await TransactionRepository.createRefundTransaction(
      id,
      refundAmount,
      refundedBy,
      reason
    );

    res.status(201).json({
      success: true,
      message: "Refund transaction created successfully",
      data: refundTransaction,
    });
  } catch (err) {
    next(err);
  }
});

// Get transaction statistics
router.get("/stats/overview", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await TransactionRepository.getTransactionStats();

    res.status(200).json({
      success: true,
      message: "Transaction statistics retrieved successfully",
      data: stats,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;