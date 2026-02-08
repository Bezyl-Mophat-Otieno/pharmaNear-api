const db = require("..");
const { generateTransactionNumber } = require("../../utils/transaction");

class TransactionRepository {
  columnNames = `
    t.transaction_id,
    t.transaction_number,
    t.order_id,
    t.customer_fullname,
    t.customer_email,
    t.customer_phone,
    t.method_of_payment,
    t.transaction_type,
    t.payment_status,
    t.total_amount,
    t.reconcilled,
    t.reconciled_by,
    t.reconciled_at,
    t.created_at,
    t.updated_at,
    td.transaction_details_id,
    td.total_amount_received,
    td.recieved_by,
    td.notes,
    u.name as reconcilled_by
  `;

  async createTransaction({ 
    orderId, 
    customerFullname, 
    customerEmail, 
    customerPhone, 
    methodOfPayment, 
    transactionType = 'order_payment',
    totalAmount,
    totalAmountReceived,
    receivedBy,
    notes 
  }) {
    try {
      await db.query("BEGIN");
      
      const transactionNumber = generateTransactionNumber();

      // First create transaction details
      const detailsQuery = `
        INSERT INTO ph_transaction_details (
          method_of_payment, total_amount_received, recieved_by, notes
        ) VALUES ($1, $2, $3, $4)
        RETURNING transaction_details_id;
      `;

      const detailsRes = await db.query(detailsQuery, [
        methodOfPayment,
        totalAmountReceived,
        receivedBy,
        notes
      ]);

      const transactionDetailsId = detailsRes.rows[0].transaction_details_id;

      // Then create the transaction
      const transactionQuery = `
        INSERT INTO ph_transactions (
          transaction_number, transaction_details_id, order_id, customer_fullname,
          customer_email, customer_phone, method_of_payment, transaction_type,
          payment_status, total_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;

      const transactionRes = await db.query(transactionQuery, [
        transactionNumber,
        transactionDetailsId,
        orderId,
        customerFullname,
        customerEmail,
        customerPhone,
        methodOfPayment,
        transactionType,
        'paid',
        totalAmount
      ]);
      await db.query("COMMIT");
      return transactionRes.rows[0];
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
  }

  async getAllTransactions({ status, transactionType, methodOfPayment, limit = 20, offset = 0 }) {
    let query = `
      SELECT ${this.columnNames}
      FROM ph_transactions t
      LEFT JOIN ph_transaction_details td ON t.transaction_details_id = td.transaction_details_id
      LEFT JOIN ph_users u ON t.reconciled_by = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND t.payment_status = $${paramCount}::payment_status_enum`;
      params.push(status);
    }

    if (transactionType) {
      paramCount++;
      query += ` AND t.transaction_type = $${paramCount}::transaction_type_enum`;
      params.push(transactionType);
    }

    if (methodOfPayment) {
      paramCount++;
      query += ` AND t.method_of_payment = $${paramCount}::method_of_payment_enum`;
      params.push(methodOfPayment);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const res = await db.query(query, params);
    return res.rows;
  }

  async getTransactionById(id) {
    const res = await db.query(`
      SELECT ${this.columnNames}
      FROM ph_transactions t
      LEFT JOIN ph_transaction_details td ON t.transaction_details_id = td.transaction_details_id
      LEFT JOIN ph_users u ON t.reconciled_by = u.user_id
      WHERE t.transaction_id = $1
    `, [id]);

    return res.rows[0] || null;
  }

  async getTransactionsByOrderId(orderId) {
    const res = await db.query(`
      SELECT ${this.columnNames}
      FROM ph_transactions t
      LEFT JOIN ph_transaction_details td ON t.transaction_details_id = td.transaction_details_id
      LEFT JOIN ph_users u ON t.reconciled_by = u.user_id
      WHERE t.order_id = $1
      ORDER BY t.created_at DESC
    `, [orderId]);

    return res.rows;
  }

  async updateTransactionStatus(id, status) {
    const res = await db.query(`
      UPDATE ph_transactions
      SET payment_status = $1::payment_status_enum,
          updated_at = CURRENT_TIMESTAMP
      WHERE transaction_id = $2
      RETURNING *;
    `, [status, id]);

    return res.rows[0];
  }

  async reconcileTransaction(id, reconciledBy, notes) {
    try {
      await db.query("BEGIN");

      // Update transaction as reconciled
      const transactionRes = await db.query(`
        UPDATE ph_transactions
        SET reconcilled = TRUE,
            reconciled_by = $1,
            reconciled_at = CURRENT_TIMESTAMP,
            payment_status = 'paid'::payment_status_enum,
            updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = $2
        RETURNING *;
      `, [reconciledBy, id]);

      if (!transactionRes.rows.length) {
        throw new Error("Transaction not found");
      }

      // Update transaction details with reconciliation notes
      if (notes) {
        await db.query(`
          UPDATE ph_transaction_details
          SET notes = COALESCE(notes || ' | ', '') || 'Reconciliation: ' || $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE transaction_details_id = $2
        `, [notes, transactionRes.rows[0].transaction_details_id]);
      }

      await db.query("COMMIT");
      return transactionRes.rows[0];
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
  }

  async createRefundTransaction(originalTransactionId, refundAmount, refundedBy, reason) {
    try {
      await db.query("BEGIN");

      // Get original transaction details
      const originalRes = await db.query(`
        SELECT * FROM ph_transactions WHERE transaction_id = $1
      `, [originalTransactionId]);

      if (!originalRes.rows.length) {
        throw new Error("Original transaction not found");
      }

      const originalTransaction = originalRes.rows[0];
      const refundTransactionNumber = generateTransactionNumber('REF');

      // Create refund transaction details
      const detailsQuery = `
        INSERT INTO ph_transaction_details (
          method_of_payment, total_amount_received, recieved_by, notes
        ) VALUES ($1, $2, $3, $4)
        RETURNING transaction_details_id;
      `;

      const detailsRes = await db.query(detailsQuery, [
        originalTransaction.method_of_payment,
        -Math.abs(refundAmount), // Negative amount for refund
        refundedBy,
        `Refund for transaction ${originalTransaction.transaction_number}. Reason: ${reason}`
      ]);

      // Create refund transaction
      const refundQuery = `
        INSERT INTO ph_transactions (
          transaction_number, transaction_details_id, order_id, customer_fullname,
          customer_email, customer_phone, method_of_payment, transaction_type,
          payment_status, total_amount, reconcilled, reconciled_by, reconciled_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        RETURNING *;
      `;

      const refundRes = await db.query(refundQuery, [
        refundTransactionNumber,
        detailsRes.rows[0].transaction_details_id,
        originalTransaction.order_id,
        originalTransaction.customer_fullname,
        originalTransaction.customer_email,
        originalTransaction.customer_phone,
        originalTransaction.method_of_payment,
        'order_refund',
        'paid',
        -Math.abs(refundAmount),
        true,
        refundedBy
      ]);

      // Update transaction_details with the transaction_id
      await db.query(
        `UPDATE ph_transaction_details SET transaction_id = $1 WHERE transaction_details_id = $2`,
        [refundRes.rows[0].transaction_id, detailsRes.rows[0].transaction_details_id]
      );

      await db.query("COMMIT");
      return refundRes.rows[0];
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
  }

  async getTransactionStats() {
    const res = await db.query(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN t.payment_status = 'paid' THEN 1 END) as paid_transactions,
        COUNT(CASE WHEN t.payment_status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN t.payment_status = 'failed' THEN 1 END) as failed_transactions,
        COUNT(CASE WHEN t.reconcilled = true THEN 1 END) as reconciled_transactions,
        SUM(CASE WHEN t.payment_status = 'paid' AND t.transaction_type = 'order_payment' THEN t.total_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN t.payment_status = 'paid' AND t.transaction_type = 'order_payment' AND t.method_of_payment = 'mpesa' THEN t.total_amount ELSE 0 END) as mpesa_revenue,
        SUM(CASE WHEN t.payment_status = 'paid' AND t.transaction_type = 'order_payment' AND t.method_of_payment = 'cash' THEN t.total_amount ELSE 0 END) as cash_revenue,
        SUM(CASE WHEN t.payment_status = 'paid' AND t.transaction_type = 'order_payment' AND t.method_of_payment = 'bank_transfer' THEN t.total_amount ELSE 0 END) as bank_revenue,
        SUM(CASE WHEN t.payment_status = 'paid' AND t.transaction_type = 'order_refund' THEN ABS(t.total_amount) ELSE 0 END) as total_refunds,
        -- Calculate total profit 
        COALESCE(SUM(
          CASE 
            WHEN t.payment_status = 'paid' AND t.transaction_type = 'order_payment' 
            THEN (
              SELECT SUM(oi.quantity * (p.selling_price - p.buying_price))
              FROM ph_order_items oi
              INNER JOIN ph_products p ON oi.product_id = p.product_id
              WHERE oi.order_id = t.order_id
            )
            ELSE 0 
          END
        ), 0) as total_profit,
        -- Calculate average order value
        CASE 
          WHEN COUNT(CASE WHEN t.payment_status = 'paid' AND t.transaction_type = 'order_payment' THEN 1 END) > 0 
          THEN SUM(CASE WHEN t.payment_status = 'paid' AND t.transaction_type = 'order_payment' THEN t.total_amount ELSE 0 END) / 
               COUNT(CASE WHEN t.payment_status = 'paid' AND t.transaction_type = 'order_payment' THEN 1 END)
          ELSE 0 
        END as average_order_value
      FROM ph_transactions t
      INNER JOIN ph_orders o ON t.order_id = o.order_id`);

    return res.rows[0];
  }
}

module.exports = new TransactionRepository();