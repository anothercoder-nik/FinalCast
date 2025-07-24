
import wrapAsync from "../utils/trycatchwrapper.js";
import Session from "../models/session.model.js";

export const createSession = wrapAsync( async (req, res) => {
  try {
    const { title, description, scheduledAt, maxParticipants, settings } = req.body;
    
    // Host is automatically the authenticated user
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

    // Check if user is the host
    if (session.host.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "Host cannot join their own session - you're already the host" });
    }

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

    // EXPLICIT HOST CHECK - Only session host can update
    const session = await Session.findOne({ 
      _id: req.params.id, 
      host: req.user._id 
    });
    
    if (!session) {
      return res.status(404).json({ 
        message: "Session not found or you are not authorized to update this session" 
      });
    }

    session.status = status;
    if (status === "live") session.startedAt = new Date();
    if (status === "ended") {
      session.endedAt = new Date();
      if (session.startedAt)
        session.duration = Math.floor((session.endedAt - session.startedAt) / 60000);
    }
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export const updateParticipantRole = wrapAsync(async (req, res) => {
  try {
    const { participantId, role } = req.body;
    
    if (!['participant', 'moderator'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'participant' or 'moderator'" });
    }

    // EXPLICIT HOST CHECK - Only session host can update roles
    const session = await Session.findOne({ 
      _id: req.params.id, 
      host: req.user._id 
    });
    
    if (!session) {
      return res.status(404).json({ 
        message: "Session not found or you are not authorized to manage this session" 
      });
    }

    const participant = session.participants.find(
      p => p.user.toString() === participantId && p.isActive
    );
    
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    participant.role = role;
    await session.save();
    
    res.json({ 
      message: `Participant role updated to ${role}`,
      participant 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export const removeParticipant = wrapAsync(async (req, res) => {
  try {
    const { participantId } = req.body;
    
    // EXPLICIT HOST CHECK - Only session host can remove participants
    const session = await Session.findOne({ 
      _id: req.params.id, 
      host: req.user._id 
    });
    
    if (!session) {
      return res.status(404).json({ 
        message: "Session not found or you are not authorized to manage this session" 
      });
    }

    const participant = session.participants.find(
      p => p.user.toString() === participantId && p.isActive
    );
    
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    participant.isActive = false;
    participant.leftAt = new Date();
    await session.save();
    
    res.json({ message: "Participant removed from session" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export const 
getSessionParticipants = wrapAsync(async (req, res) => {
  try {
    console.log('=== DEBUG SESSION PARTICIPANTS ===');
    console.log('Current user from req.user:', req.user);
    console.log('Session ID:', req.params.id);
    
    const session = await Session.findById(req.params.id)
      .populate('participants.user', 'name email avatar')
      .populate('host', 'name email avatar');
    
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    console.log('Session host:', session.host);
    console.log('Session host _id:', session.host._id);
    console.log('Current user _id:', req.user._id);
    console.log('Host comparison:', session.host._id.toString() === req.user._id.toString());

    // Check if user is host or participant
    const isHost = session.host._id.toString() === req.user._id.toString();
    const isParticipant = session.participants.some(
      p => p.user._id.toString() === req.user._id.toString() && p.isActive
    );

    console.log('isHost:', isHost);
    console.log('isParticipant:', isParticipant);

    if (!isHost && !isParticipant) {
      return res.status(403).json({ message: "Not authorized to view participants" });
    }

    res.json({
      session: {
        _id: session._id,
        title: session.title,
        host: session.host,
        participants: session.participants.filter(p => p.isActive)
      },
      isHost
    });
  } catch (err) {
    console.error('Error in getSessionParticipants:', err);
    res.status(500).json({ message: err.message });
  }
});
