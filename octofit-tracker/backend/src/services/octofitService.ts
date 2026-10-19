import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const badRequest = (message: string) => Object.assign(new Error(message), { status: 400 });
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('Activity input must be an object');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
    throw badRequest('A valid userId is required');
  }
  if (typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId)) {
    throw badRequest('A valid teamId is required');
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw badRequest('An activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('Activity minutes must be a positive number');
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) {
    throw Object.assign(new Error('The specified user or team does not exist'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const badRequest = (message: string) => Object.assign(new Error(message), { status: 400 });
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw badRequest('Team input must be an object');
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim()) {
    throw badRequest('A team name is required');
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw badRequest('A team mascot is required');
  }
  if (members !== undefined && !Array.isArray(members)) {
    throw badRequest('Team members must be an array');
  }

  const memberIds = (members ?? []) as unknown[];
  if (memberIds.some((memberId) => typeof memberId !== 'string' || !Types.ObjectId.isValid(memberId))) {
    throw badRequest('Team member IDs must be valid object IDs');
  }
  if (memberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== new Set(memberIds).size) {
      throw Object.assign(new Error('One or more team members do not exist'), { status: 404 });
    }
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    { $addFields: { totalPoints: { $sum: '$activities.points' } } },
    { $sort: { totalPoints: -1, name: 1 } },
    { $project: { _id: 0, teamName: '$name', totalPoints: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('No user found for that email address'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(5)
    .lean();
  const normalize = (value: string) => value.trim().toLowerCase();
  const focusForActivity = (type: string) => {
    const activityType = normalize(type);
    if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking'].includes(activityType)) return 'endurance';
    if (['strength', 'lift', 'weightlifting'].includes(activityType)) return 'strength';
    return activityType;
  };

  const preferences = [
    { focus: normalize(user.fitnessGoal), reason: `Recommended for your ${user.fitnessGoal} goal.` },
    ...recentActivities.map((activity) => ({
      focus: focusForActivity(activity.type),
      reason: `Recommended based on your recent ${activity.type} activity.`,
    })),
  ].filter((preference, index, all) => all.findIndex((item) => item.focus === preference.focus) === index);

  const workouts = await Workout.find().lean();
  return preferences.flatMap((preference) =>
    workouts
      .filter((workout) => normalize(workout.focus) === preference.focus)
      .map((workout) => ({ ...workout, reason: preference.reason })),
  );
}

export { User };
