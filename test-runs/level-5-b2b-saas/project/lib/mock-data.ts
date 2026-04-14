export type Question = {
  id: string;
  type: "rating" | "text";
  text: string;
  order: number;
};

export type Survey = {
  id: string;
  teamId: string;
  createdBy: string;
  title: string;
  status: "draft" | "active" | "closed";
  questions: Question[];
  sentAt?: number;
  closesAt?: number;
  createdAt: number;
  responseCount: number;
  totalRecipients: number;
};

export type TeamMember = {
  id: string;
  teamId: string;
  email: string;
  name?: string;
  role: "owner" | "member";
  status: "active" | "pending";
  joinedAt?: number;
  invitedAt: number;
};

export type Response = {
  id: string;
  surveyId: string;
  answers: {
    questionId: string;
    rating?: number;
    text?: string;
  }[];
  submittedAt: number;
};

export type WeeklyTrend = {
  week: string;
  weekLabel: string;
  questionId: string;
  questionText: string;
  averageRating: number;
};

const now = Date.now();
const day = 86400000;
const week = 7 * day;

export const TEAM = {
  id: "team_1",
  name: "Engineering Team",
  createdAt: now - 90 * day,
};

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "tm_1", teamId: "team_1", email: "alex@company.com", name: "Alex Chen", role: "owner", status: "active", joinedAt: now - 90 * day, invitedAt: now - 90 * day },
  { id: "tm_2", teamId: "team_1", email: "sarah@company.com", name: "Sarah Kim", role: "member", status: "active", joinedAt: now - 85 * day, invitedAt: now - 86 * day },
  { id: "tm_3", teamId: "team_1", email: "marcus@company.com", name: "Marcus Johnson", role: "member", status: "active", joinedAt: now - 80 * day, invitedAt: now - 81 * day },
  { id: "tm_4", teamId: "team_1", email: "priya@company.com", name: "Priya Patel", role: "member", status: "active", joinedAt: now - 75 * day, invitedAt: now - 76 * day },
  { id: "tm_5", teamId: "team_1", email: "james@company.com", name: "James Wilson", role: "member", status: "active", joinedAt: now - 60 * day, invitedAt: now - 61 * day },
  { id: "tm_6", teamId: "team_1", email: "elena@company.com", name: "Elena Rodriguez", role: "member", status: "active", joinedAt: now - 45 * day, invitedAt: now - 46 * day },
  { id: "tm_7", teamId: "team_1", email: "david@company.com", name: "David Park", role: "member", status: "active", joinedAt: now - 30 * day, invitedAt: now - 31 * day },
  { id: "tm_8", teamId: "team_1", email: "nina@company.com", name: "Nina Gupta", role: "member", status: "pending", invitedAt: now - 2 * day },
];

const sharedQuestions: Question[] = [
  { id: "q1", type: "rating", text: "How would you rate your overall satisfaction this week?", order: 0 },
  { id: "q2", type: "rating", text: "How supported do you feel by your team?", order: 1 },
  { id: "q3", type: "rating", text: "How manageable is your current workload?", order: 2 },
  { id: "q4", type: "text", text: "What's one thing we could improve?", order: 3 },
  { id: "q5", type: "text", text: "Any wins or shoutouts from this week?", order: 4 },
];

export const SURVEYS: Survey[] = [
  {
    id: "survey_1",
    teamId: "team_1",
    createdBy: "user_1",
    title: "Weekly Pulse — Week 14",
    status: "active",
    questions: sharedQuestions,
    sentAt: now - 2 * day,
    closesAt: now + 5 * day,
    createdAt: now - 2 * day,
    responseCount: 5,
    totalRecipients: 7,
  },
  {
    id: "survey_2",
    teamId: "team_1",
    createdBy: "user_1",
    title: "Weekly Pulse — Week 13",
    status: "closed",
    questions: sharedQuestions,
    sentAt: now - 9 * day,
    closesAt: now - 2 * day,
    createdAt: now - 9 * day,
    responseCount: 6,
    totalRecipients: 7,
  },
  {
    id: "survey_3",
    teamId: "team_1",
    createdBy: "user_1",
    title: "Weekly Pulse — Week 12",
    status: "closed",
    questions: sharedQuestions,
    sentAt: now - 16 * day,
    closesAt: now - 9 * day,
    createdAt: now - 16 * day,
    responseCount: 7,
    totalRecipients: 7,
  },
  {
    id: "survey_4",
    teamId: "team_1",
    createdBy: "user_1",
    title: "Sprint Retro — Q1 Close",
    status: "closed",
    questions: [
      { id: "q6", type: "rating", text: "How well did the team collaborate this sprint?", order: 0 },
      { id: "q7", type: "rating", text: "How clear were the sprint goals?", order: 1 },
      { id: "q8", type: "text", text: "What should we start doing?", order: 2 },
      { id: "q9", type: "text", text: "What should we stop doing?", order: 3 },
    ],
    sentAt: now - 23 * day,
    closesAt: now - 16 * day,
    createdAt: now - 23 * day,
    responseCount: 7,
    totalRecipients: 7,
  },
  {
    id: "survey_5",
    teamId: "team_1",
    createdBy: "user_1",
    title: "Team Morale Check",
    status: "draft",
    questions: [
      { id: "q10", type: "rating", text: "How energized do you feel about your work?", order: 0 },
      { id: "q11", type: "rating", text: "How valued do you feel on the team?", order: 1 },
      { id: "q12", type: "text", text: "What would make work more enjoyable?", order: 2 },
    ],
    createdAt: now - 1 * day,
    responseCount: 0,
    totalRecipients: 7,
  },
];

export const RESPONSES: Response[] = [
  // Survey 1 responses (active, 5 of 7)
  { id: "r1", surveyId: "survey_1", answers: [{ questionId: "q1", rating: 4 }, { questionId: "q2", rating: 5 }, { questionId: "q3", rating: 3 }, { questionId: "q4", text: "More async communication would help with focus time." }, { questionId: "q5", text: "Shipped the new onboarding flow ahead of schedule!" }], submittedAt: now - 2 * day + 3600000 },
  { id: "r2", surveyId: "survey_1", answers: [{ questionId: "q1", rating: 5 }, { questionId: "q2", rating: 4 }, { questionId: "q3", rating: 4 }, { questionId: "q4", text: "Stand-ups feel a bit long sometimes." }, { questionId: "q5", text: "Great teamwork on the API migration." }], submittedAt: now - 2 * day + 7200000 },
  { id: "r3", surveyId: "survey_1", answers: [{ questionId: "q1", rating: 3 }, { questionId: "q2", rating: 4 }, { questionId: "q3", rating: 2 }, { questionId: "q4", text: "Need more clarity on priorities — too many things in flight." }, { questionId: "q5", text: "" }], submittedAt: now - 1 * day },
  { id: "r4", surveyId: "survey_1", answers: [{ questionId: "q1", rating: 4 }, { questionId: "q2", rating: 4 }, { questionId: "q3", rating: 4 }, { questionId: "q4", text: "" }, { questionId: "q5", text: "Priya's debugging session saved us hours." }], submittedAt: now - 1 * day + 3600000 },
  { id: "r5", surveyId: "survey_1", answers: [{ questionId: "q1", rating: 4 }, { questionId: "q2", rating: 5 }, { questionId: "q3", rating: 3 }, { questionId: "q4", text: "Would love a dedicated code review slot each week." }, { questionId: "q5", text: "Clean deploy on Friday with zero rollbacks." }], submittedAt: now - 12 * 3600000 },

  // Survey 2 responses (closed, 6 of 7)
  { id: "r6", surveyId: "survey_2", answers: [{ questionId: "q1", rating: 4 }, { questionId: "q2", rating: 4 }, { questionId: "q3", rating: 3 }, { questionId: "q4", text: "Documentation is falling behind." }, { questionId: "q5", text: "Great sprint velocity." }], submittedAt: now - 8 * day },
  { id: "r7", surveyId: "survey_2", answers: [{ questionId: "q1", rating: 3 }, { questionId: "q2", rating: 3 }, { questionId: "q3", rating: 3 }, { questionId: "q4", text: "Cross-team dependencies slow us down." }, { questionId: "q5", text: "" }], submittedAt: now - 8 * day },
  { id: "r8", surveyId: "survey_2", answers: [{ questionId: "q1", rating: 5 }, { questionId: "q2", rating: 5 }, { questionId: "q3", rating: 4 }, { questionId: "q4", text: "" }, { questionId: "q5", text: "Team lunch was awesome!" }], submittedAt: now - 7 * day },
  { id: "r9", surveyId: "survey_2", answers: [{ questionId: "q1", rating: 4 }, { questionId: "q2", rating: 4 }, { questionId: "q3", rating: 4 }, { questionId: "q4", text: "More pair programming opportunities." }, { questionId: "q5", text: "" }], submittedAt: now - 7 * day },
  { id: "r10", surveyId: "survey_2", answers: [{ questionId: "q1", rating: 3 }, { questionId: "q2", rating: 4 }, { questionId: "q3", rating: 2 }, { questionId: "q4", text: "On-call rotation is too intense." }, { questionId: "q5", text: "Marcus fixed that tricky race condition." }], submittedAt: now - 6 * day },
  { id: "r11", surveyId: "survey_2", answers: [{ questionId: "q1", rating: 4 }, { questionId: "q2", rating: 5 }, { questionId: "q3", rating: 3 }, { questionId: "q4", text: "" }, { questionId: "q5", text: "Solid week overall." }], submittedAt: now - 6 * day },

  // Survey 3 responses (closed, 7 of 7)
  { id: "r12", surveyId: "survey_3", answers: [{ questionId: "q1", rating: 4 }, { questionId: "q2", rating: 4 }, { questionId: "q3", rating: 4 }, { questionId: "q4", text: "Meeting-free Wednesdays are working great." }, { questionId: "q5", text: "" }], submittedAt: now - 15 * day },
  { id: "r13", surveyId: "survey_3", answers: [{ questionId: "q1", rating: 5 }, { questionId: "q2", rating: 5 }, { questionId: "q3", rating: 5 }, { questionId: "q4", text: "" }, { questionId: "q5", text: "Best week in a while!" }], submittedAt: now - 15 * day },
  { id: "r14", surveyId: "survey_3", answers: [{ questionId: "q1", rating: 4 }, { questionId: "q2", rating: 4 }, { questionId: "q3", rating: 3 }, { questionId: "q4", text: "Need better test coverage." }, { questionId: "q5", text: "" }], submittedAt: now - 14 * day },
  { id: "r15", surveyId: "survey_3", answers: [{ questionId: "q1", rating: 3 }, { questionId: "q2", rating: 3 }, { questionId: "q3", rating: 3 }, { questionId: "q4", text: "Sprint planning takes too long." }, { questionId: "q5", text: "" }], submittedAt: now - 14 * day },
  { id: "r16", surveyId: "survey_3", answers: [{ questionId: "q1", rating: 4 }, { questionId: "q2", rating: 5 }, { questionId: "q3", rating: 4 }, { questionId: "q4", text: "" }, { questionId: "q5", text: "Great collaboration on the design system." }], submittedAt: now - 13 * day },
  { id: "r17", surveyId: "survey_3", answers: [{ questionId: "q1", rating: 4 }, { questionId: "q2", rating: 4 }, { questionId: "q3", rating: 4 }, { questionId: "q4", text: "Could use more 1:1 time with manager." }, { questionId: "q5", text: "" }], submittedAt: now - 13 * day },
  { id: "r18", surveyId: "survey_3", answers: [{ questionId: "q1", rating: 5 }, { questionId: "q2", rating: 4 }, { questionId: "q3", rating: 4 }, { questionId: "q4", text: "" }, { questionId: "q5", text: "Shipped zero bugs this week." }], submittedAt: now - 12 * day },
];

export const WEEKLY_TRENDS: WeeklyTrend[] = [
  // q1 - Overall satisfaction
  { week: "W7", weekLabel: "Feb 17", questionId: "q1", questionText: "Overall satisfaction", averageRating: 3.6 },
  { week: "W8", weekLabel: "Feb 24", questionId: "q1", questionText: "Overall satisfaction", averageRating: 3.8 },
  { week: "W9", weekLabel: "Mar 3", questionId: "q1", questionText: "Overall satisfaction", averageRating: 3.5 },
  { week: "W10", weekLabel: "Mar 10", questionId: "q1", questionText: "Overall satisfaction", averageRating: 3.9 },
  { week: "W11", weekLabel: "Mar 17", questionId: "q1", questionText: "Overall satisfaction", averageRating: 4.1 },
  { week: "W12", weekLabel: "Mar 24", questionId: "q1", questionText: "Overall satisfaction", averageRating: 4.1 },
  { week: "W13", weekLabel: "Mar 31", questionId: "q1", questionText: "Overall satisfaction", averageRating: 3.8 },
  { week: "W14", weekLabel: "Apr 7", questionId: "q1", questionText: "Overall satisfaction", averageRating: 4.0 },
  // q2 - Team support
  { week: "W7", weekLabel: "Feb 17", questionId: "q2", questionText: "Team support", averageRating: 3.9 },
  { week: "W8", weekLabel: "Feb 24", questionId: "q2", questionText: "Team support", averageRating: 4.0 },
  { week: "W9", weekLabel: "Mar 3", questionId: "q2", questionText: "Team support", averageRating: 3.7 },
  { week: "W10", weekLabel: "Mar 10", questionId: "q2", questionText: "Team support", averageRating: 4.2 },
  { week: "W11", weekLabel: "Mar 17", questionId: "q2", questionText: "Team support", averageRating: 4.3 },
  { week: "W12", weekLabel: "Mar 24", questionId: "q2", questionText: "Team support", averageRating: 4.1 },
  { week: "W13", weekLabel: "Mar 31", questionId: "q2", questionText: "Team support", averageRating: 4.2 },
  { week: "W14", weekLabel: "Apr 7", questionId: "q2", questionText: "Team support", averageRating: 4.4 },
  // q3 - Workload
  { week: "W7", weekLabel: "Feb 17", questionId: "q3", questionText: "Workload manageability", averageRating: 3.2 },
  { week: "W8", weekLabel: "Feb 24", questionId: "q3", questionText: "Workload manageability", averageRating: 3.0 },
  { week: "W9", weekLabel: "Mar 3", questionId: "q3", questionText: "Workload manageability", averageRating: 2.8 },
  { week: "W10", weekLabel: "Mar 10", questionId: "q3", questionText: "Workload manageability", averageRating: 3.4 },
  { week: "W11", weekLabel: "Mar 17", questionId: "q3", questionText: "Workload manageability", averageRating: 3.6 },
  { week: "W12", weekLabel: "Mar 24", questionId: "q3", questionText: "Workload manageability", averageRating: 3.9 },
  { week: "W13", weekLabel: "Mar 31", questionId: "q3", questionText: "Workload manageability", averageRating: 3.2 },
  { week: "W14", weekLabel: "Apr 7", questionId: "q3", questionText: "Workload manageability", averageRating: 3.2 },
];

export const SURVEY_TEMPLATES = [
  {
    name: "Weekly Pulse",
    description: "Quick 5-question check-in for weekly team health",
    questions: [
      { type: "rating" as const, text: "How would you rate your overall satisfaction this week?", order: 0 },
      { type: "rating" as const, text: "How supported do you feel by your team?", order: 1 },
      { type: "rating" as const, text: "How manageable is your current workload?", order: 2 },
      { type: "text" as const, text: "What's one thing we could improve?", order: 3 },
      { type: "text" as const, text: "Any wins or shoutouts from this week?", order: 4 },
    ],
  },
  {
    name: "Sprint Retro",
    description: "End-of-sprint reflection on collaboration and goals",
    questions: [
      { type: "rating" as const, text: "How well did the team collaborate this sprint?", order: 0 },
      { type: "rating" as const, text: "How clear were the sprint goals?", order: 1 },
      { type: "text" as const, text: "What should we start doing?", order: 2 },
      { type: "text" as const, text: "What should we stop doing?", order: 3 },
    ],
  },
  {
    name: "Team Morale",
    description: "Short morale and motivation check",
    questions: [
      { type: "rating" as const, text: "How energized do you feel about your work?", order: 0 },
      { type: "rating" as const, text: "How valued do you feel on the team?", order: 1 },
      { type: "text" as const, text: "What would make work more enjoyable?", order: 2 },
    ],
  },
];

// Helper functions for computing derived data
export function getSurveyResponses(surveyId: string): Response[] {
  return RESPONSES.filter((r) => r.surveyId === surveyId);
}

export function getRatingAnswers(surveyId: string, questionId: string): number[] {
  return getSurveyResponses(surveyId)
    .map((r) => r.answers.find((a) => a.questionId === questionId)?.rating)
    .filter((r): r is number => r !== undefined);
}

export function getTextAnswers(surveyId: string, questionId: string): string[] {
  return getSurveyResponses(surveyId)
    .map((r) => r.answers.find((a) => a.questionId === questionId)?.text)
    .filter((t): t is string => t !== undefined && t !== "");
}

export function getOverallAverage(surveyId: string): number {
  const responses = getSurveyResponses(surveyId);
  const allRatings: number[] = [];
  for (const response of responses) {
    for (const answer of response.answers) {
      if (answer.rating !== undefined) {
        allRatings.push(answer.rating);
      }
    }
  }
  if (allRatings.length === 0) return 0;
  return allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
}
