import { describe, it, expect } from "vitest";
import {
  SURVEYS,
  RESPONSES,
  TEAM_MEMBERS,
  TEAM,
  WEEKLY_TRENDS,
  SURVEY_TEMPLATES,
  getSurveyResponses,
  getRatingAnswers,
  getTextAnswers,
  getOverallAverage,
} from "@/lib/mock-data";

describe("mock data integrity", () => {
  it("has a valid team", () => {
    expect(TEAM.id).toBe("team_1");
    expect(TEAM.name).toBe("Engineering Team");
    expect(TEAM.createdAt).toBeGreaterThan(0);
  });

  it("has 8 team members", () => {
    expect(TEAM_MEMBERS).toHaveLength(8);
  });

  it("has exactly one owner", () => {
    const owners = TEAM_MEMBERS.filter((m) => m.role === "owner");
    expect(owners).toHaveLength(1);
    expect(owners[0].name).toBe("Alex Chen");
  });

  it("has one pending member", () => {
    const pending = TEAM_MEMBERS.filter((m) => m.status === "pending");
    expect(pending).toHaveLength(1);
  });

  it("has 5 surveys", () => {
    expect(SURVEYS).toHaveLength(5);
  });

  it("has surveys in all three statuses", () => {
    const statuses = new Set(SURVEYS.map((s) => s.status));
    expect(statuses.has("active")).toBe(true);
    expect(statuses.has("closed")).toBe(true);
    expect(statuses.has("draft")).toBe(true);
  });

  it("has 3 built-in templates", () => {
    expect(SURVEY_TEMPLATES).toHaveLength(3);
    expect(SURVEY_TEMPLATES.map((t) => t.name)).toEqual([
      "Weekly Pulse",
      "Sprint Retro",
      "Team Morale",
    ]);
  });

  it("has weekly trends for 3 questions over 8 weeks", () => {
    const questionIds = new Set(WEEKLY_TRENDS.map((t) => t.questionId));
    expect(questionIds.size).toBe(3);
    const weeksPerQuestion = WEEKLY_TRENDS.filter((t) => t.questionId === "q1");
    expect(weeksPerQuestion).toHaveLength(8);
  });
});

describe("getSurveyResponses", () => {
  it("returns 5 responses for survey_1 (active)", () => {
    const responses = getSurveyResponses("survey_1");
    expect(responses).toHaveLength(5);
  });

  it("returns 6 responses for survey_2 (closed)", () => {
    const responses = getSurveyResponses("survey_2");
    expect(responses).toHaveLength(6);
  });

  it("returns 7 responses for survey_3 (closed, full response)", () => {
    const responses = getSurveyResponses("survey_3");
    expect(responses).toHaveLength(7);
  });

  it("returns empty array for nonexistent survey", () => {
    expect(getSurveyResponses("nonexistent")).toEqual([]);
  });
});

describe("getRatingAnswers", () => {
  it("extracts all ratings for a specific question", () => {
    const ratings = getRatingAnswers("survey_1", "q1");
    expect(ratings).toHaveLength(5);
    ratings.forEach((r) => {
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(5);
    });
  });

  it("returns empty for text questions", () => {
    const ratings = getRatingAnswers("survey_1", "q4");
    expect(ratings).toHaveLength(0);
  });

  it("returns empty for nonexistent question", () => {
    expect(getRatingAnswers("survey_1", "nonexistent")).toEqual([]);
  });
});

describe("getTextAnswers", () => {
  it("extracts non-empty text answers", () => {
    const texts = getTextAnswers("survey_1", "q4");
    expect(texts.length).toBeGreaterThan(0);
    texts.forEach((t) => {
      expect(t.length).toBeGreaterThan(0);
    });
  });

  it("filters out empty strings", () => {
    const texts = getTextAnswers("survey_1", "q5");
    texts.forEach((t) => {
      expect(t).not.toBe("");
    });
  });

  it("returns empty for rating questions", () => {
    const texts = getTextAnswers("survey_1", "q1");
    expect(texts).toHaveLength(0);
  });
});

describe("getOverallAverage", () => {
  it("returns a value between 1 and 5 for survey with responses", () => {
    const avg = getOverallAverage("survey_1");
    expect(avg).toBeGreaterThanOrEqual(1);
    expect(avg).toBeLessThanOrEqual(5);
  });

  it("computes correct average for survey_1", () => {
    // survey_1 ratings: q1=[4,5,3,4,4], q2=[5,4,4,4,5], q3=[3,4,2,4,3]
    // all ratings: 4+5+3+4+4+5+4+4+4+5+3+4+2+4+3 = 58, count = 15
    const avg = getOverallAverage("survey_1");
    const expected = 58 / 15;
    expect(Math.abs(avg - expected)).toBeLessThan(0.01);
  });

  it("returns 0 for survey with no responses", () => {
    expect(getOverallAverage("nonexistent")).toBe(0);
  });
});

describe("anonymity design", () => {
  it("responses have no user or member reference", () => {
    for (const response of RESPONSES) {
      expect(response).not.toHaveProperty("userId");
      expect(response).not.toHaveProperty("teamMemberId");
      expect(response).not.toHaveProperty("respondentId");
      expect(response).not.toHaveProperty("email");
    }
  });

  it("response count matches actual responses for surveys with mock data", () => {
    // Surveys 1-3 have mock responses defined in RESPONSES
    const surveyIdsWithMockData = ["survey_1", "survey_2", "survey_3"];
    for (const id of surveyIdsWithMockData) {
      const survey = SURVEYS.find((s) => s.id === id);
      expect(survey).toBeDefined();
      const responses = getSurveyResponses(id);
      expect(responses.length).toBe(survey!.responseCount);
    }
  });

  it("draft survey has no responses", () => {
    const draft = SURVEYS.find((s) => s.status === "draft");
    expect(draft).toBeDefined();
    expect(getSurveyResponses(draft!.id)).toHaveLength(0);
  });
});
