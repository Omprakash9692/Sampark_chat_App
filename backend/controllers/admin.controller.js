import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Report from "../models/Report.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// 1. Get Admin Dashboard Statistics
export const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ role: "user" });
  const onlineUsers = await User.countDocuments({ isOnline: true, role: "user" });
  const totalGroups = await Conversation.countDocuments({ type: "group" });
  const activeChats = await Conversation.countDocuments();
  const totalMessages = await Message.countDocuments();
  const totalReports = await Report.countDocuments();
  const pendingReports = await Report.countDocuments({ status: "pending" });
  const blockedUsers = await User.countDocuments({ role: "user", isBlocked: true });
  const verifiedUsers = await User.countDocuments({ role: "user", isVerified: true });

  const now = new Date();
  // Calendar labels in the dashboard should match the administrator's local day,
  // rather than splitting activity at midnight UTC.
  const analyticsTimeZone = "Asia/Kolkata";
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: analyticsTimeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(now).reduce((parts, part) => {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
    return parts;
  }, {});
  const currentYear = dateParts.year;
  const currentMonthIndex = dateParts.month - 1; // 0 = Jan, 6 = Jul, 7 = Aug...

  const monthNamesFull = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Aggregate once per collection and derive every chart period from the live data.
  const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000+05:30`);
  const startOfNextYear = new Date(`${currentYear + 1}-01-01T00:00:00.000+05:30`);
  const countByDay = async (Model, match = {}) => {
    const rows = await Model.aggregate([
      { $match: { ...match, createdAt: { $gte: startOfYear, $lt: startOfNextYear } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: analyticsTimeZone } }, count: { $sum: 1 } } }
    ]);
    return new Map(rows.map(({ _id, count }) => [_id, count]));
  };
  const [usersByDay, groupsByDay, reportsByDay] = await Promise.all([
    countByDay(User, { role: { $ne: "admin" } }),
    countByDay(Conversation, { type: "group" }),
    countByDay(Report)
  ]);
  // Chart dates are UTC calendar placeholders; use their components as the
  // local calendar key used by MongoDB's timezone-aware aggregation above.
  const dateKey = (date) => [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
  const metricsForDate = (date) => ({
    users: usersByDay.get(dateKey(date)) || 0,
    groups: groupsByDay.get(dateKey(date)) || 0,
    reports: reportsByDay.get(dateKey(date)) || 0
  });
  const metricsForRange = (start, endExclusive) => {
    const totals = { users: 0, groups: 0, reports: 0 };
    for (const date = new Date(start); date < endExclusive; date.setUTCDate(date.getUTCDate() + 1)) {
      const metrics = metricsForDate(date);
      totals.users += metrics.users;
      totals.groups += metrics.groups;
      totals.reports += metrics.reports;
    }
    return totals;
  };

  // ─── 1. WEEK VIEW (Days of current week: Mon to Sun) ───────────────────────
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const localToday = new Date(Date.UTC(currentYear, currentMonthIndex, dateParts.day));
  const dayOfWeek = localToday.getUTCDay();
  const distanceToMon = (dayOfWeek + 6) % 7; 
  const mondayDate = new Date(localToday);
  mondayDate.setUTCDate(localToday.getUTCDate() - distanceToMon);

  const startOfWeek = new Date(mondayDate);

  const weekData = [];
  let runUWeek = 0, runGWeek = 0, runRWeek = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setUTCDate(d.getUTCDate() + i);
    const { users: newUsers, groups: newGroups, reports: newReports } = metricsForDate(d);

    runUWeek += newUsers;
    runGWeek += newGroups;
    runRWeek += newReports;

    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

    weekData.push({
      name: dayNames[i],
      date: dateStr,
      users: newUsers,
      groups: newGroups,
      reports: newReports,
      cumUsers: runUWeek,
      cumGroups: runGWeek,
      cumReports: runRWeek,
      newUsers,
      newGroups,
      newReports
    });
  }

  // ─── 2. MONTH VIEW (Jan to Current Month dropdown data for 2026) ──────────
  const availableMonths = [];
  const monthDataMap = {};

  for (let m = 0; m <= currentMonthIndex; m++) {
    availableMonths.push({
      index: m,
      name: monthNamesFull[m],
      shortName: monthNamesShort[m],
      year: currentYear
    });

    const monthWeeks = [];
    const daysByWeek = {
      week1: [],
      week2: [],
      week3: [],
      week4: [],
      week5: []
    };

    const lastDayOfMonth = new Date(Date.UTC(currentYear, m + 1, 0)).getUTCDate();
    const weekRanges = [
      { id: "week1", name: "Week 1", startDay: 1, endDay: 7 },
      { id: "week2", name: "Week 2", startDay: 8, endDay: 14 },
      { id: "week3", name: "Week 3", startDay: 15, endDay: 21 },
      { id: "week4", name: "Week 4", startDay: 22, endDay: 28 }
    ];

    if (lastDayOfMonth >= 29) {
      weekRanges.push({
        id: "week5",
        name: "Week 5",
        startDay: 29,
        endDay: lastDayOfMonth
      });
    }

    for (const wr of weekRanges) {
      const wStart = new Date(Date.UTC(currentYear, m, wr.startDay, 0, 0, 0, 0));
      const wEndExclusive = new Date(Date.UTC(currentYear, m, wr.endDay + 1));
      const { users: newUsers, groups: newGroups, reports: newReports } = metricsForRange(wStart, wEndExclusive);

      const labelRange = `${monthNamesShort[m]} ${wr.startDay} - ${wr.endDay}`;

      monthWeeks.push({
        id: wr.id,
        name: wr.name,
        date: labelRange,
        users: newUsers,
        groups: newGroups,
        reports: newReports,
        newUsers,
        newGroups,
        newReports
      });

      // Compute day-by-day breakdown for this week
      for (let day = wr.startDay; day <= wr.endDay; day++) {
        const dStart = new Date(Date.UTC(currentYear, m, day, 0, 0, 0, 0));
        const { users: dUsers, groups: dGroups, reports: dReports } = metricsForDate(dStart);

        daysByWeek[wr.id].push({
          name: `${monthNamesShort[m]} ${day}`,
          date: `${monthNamesShort[m]} ${day}, ${currentYear}`,
          users: dUsers,
          groups: dGroups,
          reports: dReports,
          newUsers: dUsers,
          newGroups: dGroups,
          newReports: dReports
        });
      }
    }

    monthDataMap[m] = {
      weeks: monthWeeks,
      daysByWeek: daysByWeek
    };
  }

  // ─── 3. YEAR VIEW (Real DB counts for months from Jan to Current Month in 2026) ───
  const yearData = [];

  for (let m = 0; m <= currentMonthIndex; m++) {
    const mStart = new Date(Date.UTC(currentYear, m, 1, 0, 0, 0, 0));
    const mEndExclusive = new Date(Date.UTC(currentYear, m + 1, 1));
    const { users: newUsers, groups: newGroups, reports: newReports } = metricsForRange(mStart, mEndExclusive);

    yearData.push({
      name: monthNamesShort[m],
      date: `${monthNamesShort[m]} ${currentYear}`,
      users: newUsers,
      groups: newGroups,
      reports: newReports,
      newUsers,
      newGroups,
      newReports
    });
  }

  const reportStatusRaw = await Report.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
  const reportsByStatus = ["pending", "resolved", "dismissed"].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: (reportStatusRaw.find(r => r._id === s) || { count: 0 }).count
  }));

  const stats = {
    totalUsers,
    onlineUsers,
    totalGroups,
    activeChats,
    totalMessages,
    totalReports,
    pendingReports,
    blockedUsers,
    verifiedUsers,
    weekData,
    monthDataMap,
    availableMonths,
    yearData,
    reportsByStatus
  };

  return res.status(200).json(
    new ApiResponse(200, "Admin statistics fetched successfully", { stats })
  );
});

// 2. Toggle User Block Status
export const toggleBlockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (req.user._id.toString() === userId) {
    throw new ApiError(400, "You cannot block yourself");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  // If blocked, immediately terminate all active socket connections
  if (user.isBlocked) {
    const userSockets = req.app.get("userSockets");
    const io = req.app.get("io");
    if (userSockets && io) {
      const socketIds = userSockets.get(userId.toString());
      if (socketIds) {
        socketIds.forEach(socketId => {
          const socketInstance = io.sockets.sockets.get(socketId);
          if (socketInstance) {
            socketInstance.emit("blocked-disconnect", { message: "Your account has been suspended by the administrator." });
            socketInstance.disconnect(true);
          }
        });
        userSockets.delete(userId.toString());
      }
    }
  }

  return res.status(200).json(
    new ApiResponse(200, `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`, {
      user: {
        id: user._id,
        isBlocked: user.isBlocked,
        statusText: user.isBlocked ? "Blocked" : (user.isOnline ? "Active" : "Offline")
      }
    })
  );
});

// 3. Delete User
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (req.user._id.toString() === userId) {
    throw new ApiError(400, "You cannot delete yourself");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Terminate socket connections
  const userSockets = req.app.get("userSockets");
  const io = req.app.get("io");
  if (userSockets && io) {
    const socketIds = userSockets.get(userId.toString());
    if (socketIds) {
      socketIds.forEach(socketId => {
        const socketInstance = io.sockets.sockets.get(socketId);
        if (socketInstance) {
          socketInstance.disconnect(true);
        }
      });
      userSockets.delete(userId.toString());
    }
  }

  await User.findByIdAndDelete(userId);

  return res.status(200).json(
    new ApiResponse(200, "User account deleted successfully")
  );
});

// 4. Submit Incident/Compliance Report
export const createReport = asyncHandler(async (req, res) => {
  const { reportedUserId, messageText, reason } = req.body;
  const reporterId = req.user._id;

  if (!reportedUserId || !messageText || !reason) {
    throw new ApiError(400, "reportedUserId, messageText, and reason are required");
  }

  const reportedUser = await User.findById(reportedUserId);
  if (!reportedUser) {
    throw new ApiError(404, "Reported user not found");
  }

  const report = await Report.create({
    reporter: reporterId,
    reportedUser: reportedUserId,
    messageText,
    reason
  });

  return res.status(201).json(
    new ApiResponse(201, "Incident report submitted successfully", { report })
  );
});

// 5. Get All Reports (Admin Only)
export const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find()
    .populate("reporter", "name email avatar role")
    .populate("reportedUser", "name email avatar role")
    .sort({ createdAt: -1 });

  const formattedReports = reports.map(r => ({
    id: r._id,
    reporterId: r.reporter?._id || "unknown",
    reporterName: r.reporter?.name || "Deleted User",
    reporterEmail: r.reporter?.email || "N/A",
    reportedUserId: r.reportedUser?._id || "unknown",
    reportedName: r.reportedUser?.name || "Deleted User",
    reportedEmail: r.reportedUser?.email || "N/A",
    messageText: r.messageText,
    reason: r.reason,
    status: r.status,
    timestamp: r.createdAt
  }));

  return res.status(200).json(
    new ApiResponse(200, "Reports fetched successfully", { reports: formattedReports })
  );
});


// 6. Update Report Status (Admin Only)
export const updateReportStatus = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { status } = req.body;

  if (!status || !["resolved", "dismissed"].includes(status)) {
    throw new ApiError(400, "Valid status ('resolved', 'dismissed') is required");
  }

  const report = await Report.findById(reportId);
  if (!report) {
    throw new ApiError(404, "Incident report not found");
  }

  report.status = status;
  await report.save();

  return res.status(200).json(
    new ApiResponse(200, `Incident report status updated to ${status}`, { report })
  );
});

// 7. Get All Groups (Admin Only)
export const getAllGroups = asyncHandler(async (req, res) => {
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

  return res.status(200).json(
    new ApiResponse(200, "Groups fetched successfully", { groups: formattedGroups })
  );
});

// 8. Toggle Block Status for a Group (Admin Only)
export const toggleBlockGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const group = await Conversation.findOne({ _id: groupId, type: "group" });
  if (!group) {
    throw new ApiError(404, "Group conversation not found");
  }

  group.isBlocked = !group.isBlocked;
  await group.save();

  const io = req.app.get("io");
  if (io) {
    io.emit("group-block-toggled", {
      groupId: group._id.toString(),
      isBlocked: group.isBlocked
    });
  }

  return res.status(200).json(
    new ApiResponse(200, `Group ${group.isBlocked ? "blocked" : "unblocked"} successfully`, {
      group: {
        id: group._id.toString(),
        isBlocked: group.isBlocked
      }
    })
  );
});

// 9. Delete Group (Admin Only)
export const deleteGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const group = await Conversation.findOne({ _id: groupId, type: "group" });
  if (!group) {
    throw new ApiError(404, "Group conversation not found");
  }

  await Message.deleteMany({ conversation: groupId });
  await Conversation.findByIdAndDelete(groupId);

  const io = req.app.get("io");
  if (io) {
    io.emit("group-deleted", { groupId });
  }

  return res.status(200).json(
    new ApiResponse(200, "Group deleted successfully")
  );
});
