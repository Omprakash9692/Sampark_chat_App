import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Report from "../models/Report.js";

// Helper to disconnect user sockets
const disconnectSockets = (req, userId, emitMsg) => {
  const userSockets = req.app.get("userSockets");
  const io = req.app.get("io");
  const socketIds = userSockets?.get(userId.toString());
  if (socketIds && io) {
    socketIds.forEach(id => {
      const socket = io.sockets.sockets.get(id);
      if (socket) {
        if (emitMsg) socket.emit("blocked-disconnect", { message: emitMsg });
        socket.disconnect(true);
      }
    });
    userSockets.delete(userId.toString());
  }
};

const monthFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 1. Get Admin Dashboard Statistics
export const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers, onlineUsers, totalGroups, activeChats,
      totalMessages, totalReports, pendingReports, blockedUsers, verifiedUsers
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ isOnline: true, role: "user" }),
      Conversation.countDocuments({ type: "group" }),
      Conversation.countDocuments(),
      Message.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: "pending" }),
      User.countDocuments({ role: "user", isBlocked: true }),
      User.countDocuments({ role: "user", isVerified: true })
    ]);

    const now = new Date();
    const tz = "Asia/Kolkata";
    const dateParts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" })
        .formatToParts(now).filter(p => p.type !== "literal").map(p => [p.type, Number(p.value)])
    );
    const currentYear = dateParts.year;
    const currentMonthIndex = dateParts.month - 1;

    const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000+05:30`);
    const startOfNextYear = new Date(`${currentYear + 1}-01-01T00:00:00.000+05:30`);

    const countByDay = async (Model, match = {}) => {
      const rows = await Model.aggregate([
        { $match: { ...match, createdAt: { $gte: startOfYear, $lt: startOfNextYear } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: tz } }, count: { $sum: 1 } } }
      ]);
      return new Map(rows.map(r => [r._id, r.count]));
    };

    const [usersByDay, groupsByDay, reportsByDay] = await Promise.all([
      countByDay(User, { role: { $ne: "admin" } }),
      countByDay(Conversation, { type: "group" }),
      countByDay(Report)
    ]);

    const dateKey = d => [d.getUTCFullYear(), String(d.getUTCMonth() + 1).padStart(2, "0"), String(d.getUTCDate()).padStart(2, "0")].join("-");
    const metricsForDate = d => ({
      users: usersByDay.get(dateKey(d)) || 0,
      groups: groupsByDay.get(dateKey(d)) || 0,
      reports: reportsByDay.get(dateKey(d)) || 0
    });

    const metricsForRange = (start, end) => {
      const totals = { users: 0, groups: 0, reports: 0 };
      for (const d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
        const m = metricsForDate(d);
        totals.users += m.users; totals.groups += m.groups; totals.reports += m.reports;
      }
      return totals;
    };

    // 1. Week View
    const localToday = new Date(Date.UTC(currentYear, currentMonthIndex, dateParts.day));
    const mondayDate = new Date(localToday);
    mondayDate.setUTCDate(localToday.getUTCDate() - ((localToday.getUTCDay() + 6) % 7));

    let runU = 0, runG = 0, runR = 0;
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mondayDate);
      d.setUTCDate(d.getUTCDate() + i);
      const { users, groups, reports } = metricsForDate(d);
      runU += users; runG += groups; runR += reports;
      return {
        name: dayNames[i],
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        users, groups, reports, cumUsers: runU, cumGroups: runG, cumReports: runR,
        newUsers: users, newGroups: groups, newReports: reports
      };
    });

    // 2. Month View
    const availableMonths = [];
    const monthDataMap = {};

    for (let m = 0; m <= currentMonthIndex; m++) {
      availableMonths.push({ index: m, name: monthFull[m], shortName: monthShort[m], year: currentYear });
      const lastDay = new Date(Date.UTC(currentYear, m + 1, 0)).getUTCDate();
      const weekRanges = [1, 8, 15, 22, 29]
        .filter(start => start <= lastDay)
        .map((start, idx) => ({ id: `week${idx + 1}`, name: `Week ${idx + 1}`, startDay: start, endDay: Math.min(start + 6, lastDay) }));

      const monthWeeks = [];
      const daysByWeek = {};

      for (const wr of weekRanges) {
        daysByWeek[wr.id] = [];
        const wStart = new Date(Date.UTC(currentYear, m, wr.startDay));
        const wEnd = new Date(Date.UTC(currentYear, m, wr.endDay + 1));
        const { users, groups, reports } = metricsForRange(wStart, wEnd);

        monthWeeks.push({ id: wr.id, name: wr.name, date: `${monthShort[m]} ${wr.startDay} - ${wr.endDay}`, users, groups, reports, newUsers: users, newGroups: groups, newReports: reports });

        for (let day = wr.startDay; day <= wr.endDay; day++) {
          const dStart = new Date(Date.UTC(currentYear, m, day));
          const { users: dU, groups: dG, reports: dR } = metricsForDate(dStart);
          daysByWeek[wr.id].push({
            name: `${monthShort[m]} ${day}`,
            date: `${monthShort[m]} ${day}, ${currentYear}`,
            users: dU, groups: dG, reports: dR, newUsers: dU, newGroups: dG, newReports: dR
          });
        }
      }
      monthDataMap[m] = { weeks: monthWeeks, daysByWeek };
    }

    // 3. Year View
    const yearData = Array.from({ length: currentMonthIndex + 1 }, (_, m) => {
      const { users, groups, reports } = metricsForRange(new Date(Date.UTC(currentYear, m, 1)), new Date(Date.UTC(currentYear, m + 1, 1)));
      return { name: monthShort[m], date: `${monthShort[m]} ${currentYear}`, users, groups, reports, newUsers: users, newGroups: groups, newReports: reports };
    });

    const reportStatusRaw = await Report.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const reportsByStatus = ["pending", "resolved", "dismissed"].map(s => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: reportStatusRaw.find(r => r._id === s)?.count || 0
    }));

    return res.status(200).json({
      success: true,
      message: "Admin statistics fetched successfully",
      data: {
        stats: { totalUsers, onlineUsers, totalGroups, activeChats, totalMessages, totalReports, pendingReports, blockedUsers, verifiedUsers, weekData, monthDataMap, availableMonths, yearData, reportsByStatus }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to fetch admin stats" });
  }
};

// 2. Toggle User Block Status
export const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ success: false,
 message: "You cannot block yourself" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false,
 message: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    if (user.isBlocked) disconnectSockets(req, userId, "Your account has been suspended by the administrator.");

    return res.status(200).json({
      success: true,
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
      data: {
        user: { id: user._id, isBlocked: user.isBlocked, statusText: user.isBlocked ? "Blocked" : (user.isOnline ? "Active" : "Offline") }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to toggle user block status" });
  }
};

// 3. Delete User
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ success: false,
 message: "You cannot delete yourself" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false,
 message: "User not found" });
    }

    disconnectSockets(req, userId);

    const directConvs = await Conversation.find({ type: "direct", participants: userId });
    const directConvIds = directConvs.map(c => c._id.toString());

    if (directConvIds.length) {
      await Message.deleteMany({ conversation: { $in: directConvIds } });
      await Conversation.deleteMany({ _id: { $in: directConvIds } });
    }

    await Conversation.updateMany({ type: "group" }, { $pull: { participants: userId, adminIds: userId } });
    await User.findByIdAndDelete(userId);

    req.app.get("io")?.emit("user-deleted", { userId: userId.toString(), conversationIds: directConvIds });
    return res.status(200).json({ success: true,
 message: "User account deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to delete user" });
  }
};

// 4. Submit Incident/Compliance Report
export const createReport = async (req, res) => {
  try {
    const { reportedUserId, messageText, reason } = req.body;
    if (!reportedUserId || !messageText || !reason) {
      return res.status(400).json({ success: false,
 message: "reportedUserId, messageText, and reason are required" });
    }

    if (!(await User.exists({ _id: reportedUserId }))) {
      return res.status(404).json({ success: false,
 message: "Reported user not found" });
    }

    const report = await Report.create({ reporter: req.user._id, reportedUser: reportedUserId, messageText, reason });
    return res.status(201).json({
      success: true,
      message: "Incident report submitted successfully",
      data: { report }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to create report" });
  }
};

// 5. Get All Reports (Admin Only)
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name phone")
      .populate("reportedUser", "name phone")
      .sort({ createdAt: -1 });

    const formattedReports = reports.map(r => ({
      id: r._id.toString(),
      reporterId: r.reporter?._id || "unknown",
      reporterName: r.reporter?.name || "Deleted User",
      reporterPhone: r.reporter?.phone || null,
      reportedUserId: r.reportedUser?._id || "unknown",
      reportedName: r.reportedUser?.name || "Deleted User",
      reportedPhone: r.reportedUser?.phone || null,
      messageText: r.messageText,
      reason: r.reason,
      status: r.status,
      timestamp: r.createdAt
    }));

    return res.status(200).json({
      success: true,
      message: "Reports fetched successfully",
      data: { reports: formattedReports }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to fetch reports" });
  }
};

// 6. Update Report Status (Admin Only)
export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    if (!["resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ success: false,
 message: "Valid status ('resolved', 'dismissed') is required" });
    }

    const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });
    if (!report) {
      return res.status(404).json({ success: false,
 message: "Incident report not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Incident report status updated to ${status}`,
      data: { report }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to update report status" });
  }
};

// 7. Get All Groups (Admin Only)
export const getAllGroups = async (req, res) => {
  try {
    const groups = await Conversation.find({ type: "group" })
      .populate("participants", "name email avatar")
      .populate("adminIds", "name email")
      .sort({ createdAt: -1 });

    const formattedGroups = groups.map(g => ({
      id: g._id.toString(),
      name: g.name,
      avatar: g.avatar,
      description: g.description,
      membersCount: g.participants.length,
      isBlocked: g.isBlocked || false,
      createdAt: g.createdAt,
      adminNames: (g.adminIds || []).map(a => a.name).join(", ")
    }));

    return res.status(200).json({
      success: true,
      message: "Groups fetched successfully",
      data: { groups: formattedGroups }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to fetch groups" });
  }
};

// 8. Toggle Block Status for a Group (Admin Only)
export const toggleBlockGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Conversation.findOne({ _id: groupId, type: "group" });
    if (!group) {
      return res.status(404).json({ success: false,
 message: "Group conversation not found" });
    }

    group.isBlocked = !group.isBlocked;
    await group.save();

    req.app.get("io")?.emit("group-block-toggled", { groupId: group._id.toString(), isBlocked: group.isBlocked });

    return res.status(200).json({
      success: true,
      message: `Group ${group.isBlocked ? "blocked" : "unblocked"} successfully`,
      data: {
        group: { id: group._id.toString(), isBlocked: group.isBlocked }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to toggle group block status" });
  }
};

// 9. Delete Group (Admin Only)
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Conversation.findOne({ _id: groupId, type: "group" });
    if (!group) {
      return res.status(404).json({ success: false,
 message: "Group conversation not found" });
    }

    await Message.deleteMany({ conversation: groupId });
    await Conversation.findByIdAndDelete(groupId);

    req.app.get("io")?.emit("group-deleted", { groupId });

    return res.status(200).json({ success: true,
 message: "Group deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false,
 message: error.message || "Failed to delete group" });
  }
};
