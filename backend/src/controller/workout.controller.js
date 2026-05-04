const Exercise = require('../models/Exercise');
const WorkoutPlan = require('../models/WorkoutPlan');
const AssignedWorkout = require('../models/AssignedWorkout');
const WorkoutSession = require('../models/WorkoutSession');
const Notification = require('../models/Notification');
const WorkoutRequest = require('../models/WorkoutRequest');
const ConsultationRecord = require('../models/ConsultationRecord');

// -- EXERCISES --
exports.getExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find();
    res.json(exercises);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createExercise = async (req, res) => {
  try {
    const exercise = await Exercise.create(req.body);
    res.status(201).json(exercise);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exercise) return res.status(404).json({ message: 'Not found' });
    res.json(exercise);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndDelete(req.params.id);
    if (!exercise) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// -- WORKOUT PLANS --
exports.getWorkoutPlans = async (req, res) => {
  try {
    const plans = await WorkoutPlan.find().populate({
      path: 'days.exercises'
    });
    res.json(plans);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createWorkoutPlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.create({ ...req.body, trainer: req.user._id });
    res.status(201).json(plan);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateWorkoutPlan = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ message: 'Not found' });
    res.json(plan);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// -- REQUESTS --
exports.createWorkoutRequest = async (req, res) => {
  const { coachId, fitnessLevel, goals, notes } = req.body;
  try {
    const request = await WorkoutRequest.create({
      member: req.user._id,
      coach: coachId,
      fitnessLevel,
      goals,
      notes
    });

    await Notification.create({
      user: coachId,
      title: 'New Workout Request',
      message: 'A member has requested a personalized workout plan.',
      type: 'General'
    });

    res.status(201).json(request);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getWorkoutRequests = async (req, res) => {
  try {
    const isCoach = req.user.role === 'Trainer' || req.user.role === 'Admin';
    const query = isCoach ? { coach: req.user._id } : { member: req.user._id };
    const requests = await WorkoutRequest.find(query)
      .populate('member', 'name email')
      .populate('coach', 'name email');
    res.json(requests);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateWorkoutRequestStatus = async (req, res) => {
  const { status, rejectionReason } = req.body;
  try {
    const request = await WorkoutRequest.findByIdAndUpdate(req.params.id, { status, rejectionReason }, { new: true }).populate('member');
    if (!request) return res.status(404).json({ message: 'Not found' });

    let message = `Your workout plan request has been ${status}.`;
    if (status === 'Rejected' && rejectionReason) {
      message += ` Reason: ${rejectionReason}`;
    }

    await Notification.create({
      user: request.member._id,
      title: 'Workout Request Update',
      message,
      type: 'General'
    });

    res.json(request);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// -- ASSIGNED WORKOUTS & SCHEDULING --
exports.getAssignedWorkouts = async (req, res) => {
  try {
    const assigned = await AssignedWorkout.find({ member: req.user._id })
      .populate({
        path: 'workoutPlan',
        populate: { path: 'days.exercises' }
      })
      .populate('schedule.exercises');
    res.json(assigned);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.assignWorkout = async (req, res) => {
  const { workoutPlanId, memberId } = req.body;
  try {
    const assigned = await AssignedWorkout.create({
      member: memberId || req.user._id,
      workoutPlan: workoutPlanId
    });
    
    if (memberId && memberId !== req.user._id.toString()) {
      await Notification.create({
        user: memberId,
        title: 'New Workout Plan',
        message: 'A trainer has assigned you a new personalized workout plan.',
        type: 'General'
      });
    }

    res.status(201).json(assigned);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.generateAutoSchedule = async (req, res) => {
  const { availableDays, fitnessLevel } = req.body;
  try {
    const plan = await WorkoutPlan.findOne({ fitnessLevel }).populate('days.exercises');
    if (!plan) return res.status(404).json({ message: 'No workout plan found for this level.' });

    if (!plan.days || plan.days.length === 0) {
      return res.status(400).json({ message: 'Selected plan has no exercise days configured.' });
    }

    const schedule = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let today = new Date();
    let planDayIndex = 0;

    for (let i = 0; i < 28; i++) {
      let d = new Date(today);
      d.setDate(today.getDate() + i);
      let dayName = dayNames[d.getDay()];

      if (availableDays.includes(dayName)) {
        let dayFromPlan = plan.days[planDayIndex % plan.days.length];
        schedule.push({
          date: d,
          isCompleted: false,
          exercises: dayFromPlan.exercises.map(e => e._id)
        });
        planDayIndex++;
      }
    }

    const assigned = await AssignedWorkout.create({
      member: req.user._id,
      workoutPlan: plan._id,
      schedule,
      completionStatus: 0
    });

    res.status(201).json(assigned);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateProgress = async (req, res) => {
  const { assignedWorkoutId, scheduleId } = req.body;
  try {
    const assigned = await AssignedWorkout.findById(assignedWorkoutId);
    if (!assigned) return res.status(404).json({ message: 'Not found' });

    let completedCount = 0;
    assigned.schedule.forEach(s => {
      if (s._id.toString() === scheduleId) {
        s.isCompleted = true;
      }
      if (s.isCompleted) completedCount++;
    });

    assigned.completionStatus = Math.round((completedCount / assigned.schedule.length) * 100);
    await assigned.save();

    res.json(assigned);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// -- CONSULTATIONS --
exports.logConsultation = async (req, res) => {
  const { memberId, date, notes, followUpActions } = req.body;
  try {
    const record = await ConsultationRecord.create({
      member: memberId,
      coach: req.user._id,
      date,
      notes,
      followUpActions
    });

    await Notification.create({
      user: memberId,
      title: 'Consultation Logged',
      message: 'Your coach has logged notes from your recent consultation.',
      type: 'General'
    });

    res.status(201).json(record);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getConsultationHistory = async (req, res) => {
  try {
    const isCoach = req.user.role === 'Trainer' || req.user.role === 'Admin';
    const query = isCoach ? { coach: req.user._id } : { member: req.user._id };
    const records = await ConsultationRecord.find(query)
      .populate('member', 'name email')
      .populate('coach', 'name email')
      .sort({ date: -1 });
    res.json(records);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// -- SESSIONS --
exports.getSessions = async (req, res) => {
  try {
    const isTrainer = req.user.role === 'Trainer' || req.user.role === 'Admin';
    const query = isTrainer ? { trainer: req.user._id } : { member: req.user._id };
    const sessions = await WorkoutSession.find(query)
      .populate('member', 'name email')
      .populate('trainer', 'name email');
    res.json(sessions);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.bookSession = async (req, res) => {
  const { trainerId, date, time } = req.body;
  try {
    const existing = await WorkoutSession.findOne({ trainer: trainerId, date, time });
    if (existing) {
      return res.status(400).json({ message: 'This time slot is already booked.' });
    }

    const session = await WorkoutSession.create({
      member: req.user._id,
      trainer: trainerId,
      date,
      time
    });

    await Notification.create({
      user: trainerId,
      title: 'New Session Booking',
      message: 'A member has booked a new training session with you.',
      type: 'General'
    });

    res.status(201).json(session);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateSessionStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const session = await WorkoutSession.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('member');
    if (!session) return res.status(404).json({ message: 'Not found' });

    await Notification.create({
      user: session.member._id,
      title: 'Session Update',
      message: `Your training session has been ${status}.`,
      type: 'General'
    });

    res.json(session);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
