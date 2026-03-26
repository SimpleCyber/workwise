import { mutation } from "./_generated/server";

export const fixNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db.query("notifications").collect();
    let updatedCount = 0;

    for (const notification of notifications) {
      const anyNotification = notification as any;
      if (anyNotification.emailSent === undefined) {
        const emailSentValue = anyNotification.sendedmail ?? false;

        await ctx.db.patch(notification._id, {
          emailSent: emailSentValue,
        });
        updatedCount++;
      }
    }
    return { updatedCount };
  },
});
