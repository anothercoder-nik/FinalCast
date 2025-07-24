
import wrapAsync from "../utils/trycatchwrapper.js";
import Session from "../models/session.model.js";

export const createSession = wrapAsync( async (req, res) => {
  try {
    const { title, description, scheduledAt, maxParticipants, settings } = req.body;
    const session = new Session({
      title,
      description,
      scheduledAt,
      maxParticipants,
      settings,
      host: req.user._id
    });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export const getAllSessions = wrapAsync(async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [
        { host: req.user._id },
        { "participants.user": req.user._id }
      ]
    }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export const joinSession = wrapAsync(async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const activeCount = session.participants.filter(p => p.isActive).length;
    if (activeCount >= session.maxParticipants) {
      return res.status(400).json({ message: "Session is full" });
      
    }

    const alreadyParticipant = session.participants.some(
      p => p.user.toString() === req.user._id.toString() && p.isActive
    );
    if (alreadyParticipant) {
      return res.status(400).json({ message: "Already joined" });
    }

    session.participants.push({ user: req.user._id });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export const joinSessionByRoomId = wrapAsync(async (req, res) => {
  try {
    const session = await Session.findOne({ roomId: req.params.roomId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const activeCount = session.participants.filter(p => p.isActive).length;
    if (activeCount >= session.maxParticipants) {
      return res.status(400).json({ message: "Session is full" });
    }

    const alreadyParticipant = session.participants.some(
      p => p.user.toString() === req.user._id.toString() && p.isActive
    );
    if (alreadyParticipant) {
      return res.status(400).json({ message: "Already joined" });
    }

    session.participants.push({ user: req.user._id });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export const leaveSession = wrapAsync(async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const participant = session.participants.find(
      p => p.user.toString() === req.user._id.toString() && p.isActive
    );
    if (!participant) {
      return res.status(400).json({ message: "You are not an active participant" });
    }

    participant.isActive = false;
    participant.leftAt = new Date();
    await session.save();

    res.json({ message: "Left the session" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export const updateSession = wrapAsync(async (req, res) => {
  try {
    const { status } = req.body;
    if (!["scheduled", "live", "ended", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const session = await Session.findOne({ _id: req.params.id, host: req.user._id });
    if (!session) return res.status(404).json({ message: "Session not found or not authorized" });

    session.status = status;
    if (status === "live") session.startedAt = new Date();
    if (status === "ended") {
      session.endedAt = new Date();
      if (session.startedAt)
        session.duration = Math.floor((session.endedAt - session.startedAt) / 60000); // duration in minutes
    }
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
