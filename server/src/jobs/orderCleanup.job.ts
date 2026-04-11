import cron from "node-cron";
import Order, { OrderStatus, PaymentStatus } from "../api/v1/models/order.model";
import ShowTime from "../api/v1/models/showTime.model";
import { ShowTimeSeatStatus } from "../types/showTime.type";

/**
 * Job tự động hủy các order quá hạn thanh toán (15 phút)
 * Chạy mỗi 5 phút
 */
export const startOrderCleanupJob = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("🔄 Running order cleanup job...");

      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      // Tìm các order pending quá 15 phút
      const expiredOrders = await Order.find({
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: { $lt: fifteenMinutesAgo },
        deleted: false,
      });

      console.log(`📦 Found ${expiredOrders.length} expired orders`);

      for (const order of expiredOrders) {
        try {
          // Update order status
          order.orderStatus = OrderStatus.EXPIRED;
          order.paymentStatus = PaymentStatus.FAILED;
          await order.save();

          // Unlock seats
          const showtime = await ShowTime.findById(order.showtimeId);
          if (showtime) {
            const seatKeys = order.seats.map((s) => s.seatKey);
            let unlockedCount = 0;

            for (const seatKey of seatKeys) {
              const seatIndex = showtime.seats.findIndex(
                (s) => s.seatKey === seatKey
              );
              if (
                seatIndex !== -1 &&
                showtime.seats[seatIndex].status === ShowTimeSeatStatus.LOCKED
              ) {
                showtime.seats[seatIndex].status = ShowTimeSeatStatus.AVAILABLE;
                unlockedCount++;
              }
            }

            if (unlockedCount > 0) {
              await showtime.save();
              console.log(
                `✅ Unlocked ${unlockedCount} seats for order ${order.ticketCode}`
              );
            }
          }

          console.log(`❌ Expired order ${order.ticketCode}`);
        } catch (error) {
          console.error(`Error processing order ${order.ticketCode}:`, error);
        }
      }

      console.log("✅ Order cleanup job completed");
    } catch (error) {
      console.error("❌ Order cleanup job error:", error);
    }
  });

  console.log("🚀 Order cleanup job started (runs every 5 minutes)");
};