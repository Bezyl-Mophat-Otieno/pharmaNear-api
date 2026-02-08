const db = require("..");
const { generateOrderNumber } = require("../../utils/order");

class OrdersRepository {
    columnNames = `
        jsonb_build_object(
        'orderId', o.order_id,
        'orderNumber', o.order_number,
        'items', COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'product', jsonb_build_object(
                'productId', p.product_id,
                'name', p.name,
                'price', p.selling_price,
                'images', p.images
              ),
              'unitPrice', oi.unit_price,
              'quantity', oi.quantity,
              'subtotal', oi.subtotal
            )
          ),
          '[]'::jsonb
        ),

        'total', o.total_amount,

        'customerInfo', jsonb_build_object(
          'name', o.customer_fullname,
          'email', o.customer_email,
          'phone', o.customer_phone,
          'address', o.shipping_address
        ),

        'status', o.status,
        'paymentStatus', o.payment_status,
        'paymentMethod', o.method_of_payment,

        'createdAt', o.placed_at,
        'updatedAt', o.updated_at
      ) AS order`
  async createOrder({ customer_fullname, customer_email, customer_phone, shipping_address, method_of_payment ,items = [], notes }) {
    try {
      await db.query("BEGIN");
      const orderNumber = generateOrderNumber();
      const totalAmount = items.reduce((acc, item) => {
        return acc + item.unitPrice * item.quantity;
      }, 0);

      const insertOrderQuery = `
        INSERT INTO bq_orders (customer_fullname, customer_email, customer_phone, method_of_payment, order_number, total_amount, shipping_address, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;

      const orderRes = await db.query(insertOrderQuery, [
        customer_fullname,
        customer_email,
        customer_phone,
        method_of_payment,
        orderNumber,
        totalAmount,
        shipping_address,
        notes || null,
      ]);

      const order = orderRes.rows[0];

      const insertItemQuery = `
        INSERT INTO bq_order_items (order_id, product_id, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5);
      `;

      for (const item of items) {
        const subtotal = item.unitPrice * item.quantity;
        await db.query(insertItemQuery, [
          order.order_id,
          item.productId,
          item.quantity,
          item.unitPrice,
          subtotal,
        ]);
      }

      await db.query("COMMIT");
      return order;
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
  }

  async getOrderById(id) {
    const orderRes = await db.query(`
      SELECT ${this.columnNames} FROM bq_orders o
      INNER JOIN bq_order_items oi
        ON oi.order_id = o.order_id
      INNER JOIN bq_products p
        ON p.product_id = oi.product_id
      WHERE o.order_id = $1
      GROUP BY
        o.order_id`, [id]);
    if (!orderRes.rows.length) return null;

    return orderRes.rows.map(o=>o.order)[0];
  }

  async getOrdersByUserEmail(email) {
    const orderRes = await db.query(`SELECT ${this.columnNames} FROM bq_orders o
      INNER JOIN bq_order_items oi
        ON oi.order_id = o.order_id
      INNER JOIN bq_products p
        ON p.product_id = oi.product_id
      WHERE o.customer_email = $1
      GROUP BY
        o.order_id 
      ORDER BY placed_at DESC`, [email]);
    return orderRes.rows.map(o=>o.order);
  }

  async getAllOrders({ status, limit = 20, offset = 0 }) {
    let query = `SELECT ${this.columnNames}
      FROM bq_orders o
      INNER JOIN bq_order_items oi
        ON oi.order_id = o.order_id
      INNER JOIN bq_products p
        ON p.product_id = oi.product_id
      `;
    const params = [];

    if (status) {
      query += `WHERE o.status = $1`;
      params.push(status);
    }

    query += `GROUP BY o.order_id ORDER BY o.placed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const orderRes = await db.query(query, params);
    return orderRes.rows.map(o=> o.order);
  }

  async updateOrderStatus(id, status) {
    const res = await db.query(
      `
      UPDATE bq_orders
      SET status = $1::order_status_enum,
          delivered_at = CASE WHEN $1::order_status_enum = 'delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $2
      RETURNING *;
    `,
      [status, id]
    );

    return this.getOrderById(id);
  }

  async updateOrderPaymentStatus(id, paymentStatus) {
    try {
      await db.query("BEGIN");

      // Get current payment status to check if we're switching to 'paid'
      const currentOrderRes = await db.query(
        `SELECT payment_status FROM bq_orders WHERE order_id = $1`,
        [id]
      );

      if (!currentOrderRes.rows.length) {
        throw new Error("Order not found");
      }

      const currentPaymentStatus = currentOrderRes.rows[0].payment_status;

      // Update the payment status
      const res = await db.query(
        `
        UPDATE bq_orders
        SET payment_status = $1::payment_status_enum,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $2
        RETURNING *;
      `,
        [paymentStatus, id]
      );

      // If payment status is being changed to 'paid' and wasn't already 'paid'
      if (paymentStatus === 'paid' && currentPaymentStatus !== 'paid') {
        // Get all order items for this order
        const orderItemsRes = await db.query(
          `SELECT product_id, quantity FROM bq_order_items WHERE order_id = $1`,
          [id]
        );

        // Update stock for each product
        for (const item of orderItemsRes.rows) {
          await db.query(
            `
            UPDATE bq_products 
            SET stock = stock - $1,
                total_sold = total_sold + $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE product_id = $2 AND stock >= $1
          `,
            [item.quantity, item.product_id]
          );

          // Check if stock update was successful (affected rows > 0)
          const stockCheckRes = await db.query(
            `SELECT stock FROM bq_products WHERE product_id = $1`,
            [item.product_id]
          );

          if (stockCheckRes.rows.length === 0) {
            throw new Error(`Product ${item.product_id} not found`);
          }

          if (stockCheckRes.rows[0].stock < 0) {
            throw new Error(`Insufficient stock for product ${item.product_id}`);
          }
        }
      }

      await db.query("COMMIT");
      return this.getOrderById(id);
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
  }

  async deleteOrder(id) {
    // Optional: implement a soft delete
    await db.query(`UPDATE bq_orders SET status = 'cancelled'::order_status_enum, updated_at = CURRENT_TIMESTAMP WHERE order_id = $1`, [id]);
  }

  async cancelOrder(id, reason = null) {
    try {
      await db.query("BEGIN");

      // Get current order details
      const orderRes = await db.query(
        `SELECT status, payment_status FROM bq_orders WHERE order_id = $1`,
        [id]
      );

      if (!orderRes.rows.length) {
        throw new Error("Order not found");
      }

      const { status: currentStatus, payment_status: currentPaymentStatus } = orderRes.rows[0];

      // Check if order can be cancelled
      if (currentStatus === 'cancelled') {
        throw new Error("Order is already cancelled");
      }

      if (currentStatus === 'delivered' || currentStatus === 'completed') {
        throw new Error("Cannot cancel a delivered or completed order");
      }

      // Update order status to cancelled
      await db.query(
        `
        UPDATE bq_orders
        SET status = 'cancelled'::order_status_enum,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $1
        RETURNING *;
      `,
        [id]
      );

      // If order was paid, change payment status to refunded and revert stock
      if (currentPaymentStatus === 'paid') {
        await db.query(
          `
          UPDATE bq_orders
          SET payment_status = 'refunded'::payment_status_enum,
              updated_at = CURRENT_TIMESTAMP
          WHERE order_id = $1
        `,
          [id]
        );

        // Get all order items to revert stock changes
        const orderItemsRes = await db.query(
          `SELECT product_id, quantity FROM bq_order_items WHERE order_id = $1`,
          [id]
        );

        // Revert stock for each product (add back the quantities)
        for (const item of orderItemsRes.rows) {
          await db.query(
            `
            UPDATE bq_products 
            SET stock = stock + $1,
                total_sold = GREATEST(total_sold - $1, 0),
                updated_at = CURRENT_TIMESTAMP
            WHERE product_id = $2
          `,
            [item.quantity, item.product_id]
          );
        }
      }

      // Optional: Log cancellation reason
      if (reason) {
        await db.query(
          `
          UPDATE bq_orders
          SET notes = COALESCE(notes || ' | ', '') || 'Cancellation reason: ' || $1
          WHERE order_id = $2
        `,
          [reason, id]
        );
      }

      await db.query("COMMIT");
      
      // Return updated order
      const finalOrderRes = await db.query(
        `SELECT * FROM bq_orders WHERE order_id = $1`,
        [id]
      );
      
      return this.getOrderById(id);
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
  }

   async getItemsByOrder(orderId) {
    const res = await db.query(`SELECT * FROM bq_order_items WHERE order_id = $1`, [orderId]);
    return res.rows;
  }
}

module.exports = new OrdersRepository();
