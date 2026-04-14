import { describe, it, expect } from "bun:test";
import {
  parseFeatures,
  parseFeatureBlock,
  toKebabCase,
  generateFeatureChecklist,
  buildIssueBody,
  buildIssueLabels,
  type ParsedFeature,
} from "./decomposer.js";

const SAMPLE_SPEC = `# Product Spec

### 2. Features

#### User Authentication
- **Description:** Allow users to sign up and log in
- **User story:** As a user, I want to sign up so that I can access the app
- **Priority:** P0
- **Category:** fullstack
- **Size estimate:** M
- **Acceptance criteria:**
  - Given a new visitor, When they submit the sign-up form with valid email and password, Then an account is created and they are redirected to the dashboard
  - Given an existing user, When they enter wrong credentials, Then they see an error message
- **Dependencies:** none

#### Dashboard
- **Description:** Main user dashboard showing key metrics
- **User story:** As a user, I want to see my dashboard so that I can track my progress
- **Priority:** P0
- **Category:** frontend
- **Size estimate:** L
- **Acceptance criteria:**
  - Given a logged-in user, When they navigate to /dashboard, Then they see their metrics
- **Dependencies:** User Authentication

### 3. Data Models
User model with fields...
`;

describe("decomposer", () => {
  describe("parseFeatures", () => {
    it("extracts features from a product spec", () => {
      const features = parseFeatures(SAMPLE_SPEC);
      expect(features).toHaveLength(2);
      expect(features[0].name).toBe("User Authentication");
      expect(features[1].name).toBe("Dashboard");
    });

    it("extracts priority correctly", () => {
      const features = parseFeatures(SAMPLE_SPEC);
      expect(features[0].priority).toBe("P0");
    });

    it("extracts category correctly", () => {
      const features = parseFeatures(SAMPLE_SPEC);
      expect(features[0].category).toBe("fullstack");
      expect(features[1].category).toBe("frontend");
    });

    it("extracts size correctly", () => {
      const features = parseFeatures(SAMPLE_SPEC);
      expect(features[0].size).toBe("M");
      expect(features[1].size).toBe("L");
    });

    it("extracts acceptance criteria", () => {
      const features = parseFeatures(SAMPLE_SPEC);
      expect(features[0].acceptanceCriteria.length).toBe(2);
      expect(features[0].acceptanceCriteria[0]).toContain("Given a new visitor");
    });

    it("extracts dependencies", () => {
      const features = parseFeatures(SAMPLE_SPEC);
      expect(features[0].dependencies).toEqual([]);
      expect(features[1].dependencies).toEqual(["User Authentication"]);
    });

    it("returns empty array when no features section", () => {
      const features = parseFeatures("# Some other doc\nNo features here.");
      expect(features).toEqual([]);
    });
  });

  describe("parseFeatureBlock", () => {
    it("parses a well-formatted feature block", () => {
      const block = `#### Sign Up
- **Description:** User registration
- **User story:** As a visitor, I want to sign up so that I can use the app
- **Priority:** P0
- **Category:** fullstack
- **Size:** S
- **Acceptance criteria:**
  - Given a visitor, When they submit valid data, Then account is created
- **Dependencies:** none`;

      const feature = parseFeatureBlock(block);
      expect(feature).not.toBeNull();
      expect(feature!.name).toBe("Sign Up");
      expect(feature!.priority).toBe("P0");
      expect(feature!.size).toBe("S");
    });

    it("returns null for blocks without a heading", () => {
      expect(parseFeatureBlock("just some text")).toBeNull();
    });

    it("defaults priority to P1 when not specified", () => {
      const block = `#### Some Feature
- **Description:** A feature`;
      const feature = parseFeatureBlock(block);
      expect(feature!.priority).toBe("P1");
    });

    it("defaults category to fullstack when not specified", () => {
      const block = `#### Some Feature
- **Description:** A feature`;
      const feature = parseFeatureBlock(block);
      expect(feature!.category).toBe("fullstack");
    });
  });

  describe("toKebabCase", () => {
    it("converts feature names to kebab-case", () => {
      expect(toKebabCase("User Authentication")).toBe("user-authentication");
    });

    it("handles special characters", () => {
      expect(toKebabCase("OAuth 2.0 Login")).toBe("oauth-20-login");
    });

    it("handles multiple spaces", () => {
      expect(toKebabCase("Some   Feature   Name")).toBe(
        "some-feature-name"
      );
    });

    it("handles already kebab-case input", () => {
      expect(toKebabCase("already-kebab")).toBe("already-kebab");
    });

    it("trims leading/trailing hyphens", () => {
      expect(toKebabCase(" Feature ")).toBe("feature");
    });
  });

  describe("generateFeatureChecklist", () => {
    const feature: ParsedFeature = {
      name: "User Auth",
      description: "Authentication system",
      userStory: "As a user, I want to log in",
      priority: "P0",
      category: "fullstack",
      size: "M",
      acceptanceCriteria: [
        "Given valid credentials, When user logs in, Then session is created",
      ],
      dependencies: ["Database Setup"],
    };

    it("includes the feature name as heading", () => {
      const md = generateFeatureChecklist(feature, 0, 5);
      expect(md).toContain("# User Auth");
    });

    it("includes priority, category, and size", () => {
      const md = generateFeatureChecklist(feature, 0, 5);
      expect(md).toContain("**Priority:** P0");
      expect(md).toContain("**Category:** fullstack");
      expect(md).toContain("**Size:** M");
    });

    it("includes the order", () => {
      const md = generateFeatureChecklist(feature, 2, 10);
      expect(md).toContain("**Order:** 3 of 10");
    });

    it("includes acceptance criteria as checklist items", () => {
      const md = generateFeatureChecklist(feature, 0, 1);
      expect(md).toContain(
        "- [ ] Given valid credentials, When user logs in, Then session is created"
      );
    });

    it("includes dependencies", () => {
      const md = generateFeatureChecklist(feature, 0, 1);
      expect(md).toContain("- Database Setup");
    });

    it("generates fallback checklist when no acceptance criteria", () => {
      const noAC: ParsedFeature = {
        ...feature,
        acceptanceCriteria: [],
        category: "backend",
      };
      const md = generateFeatureChecklist(noAC, 0, 1);
      expect(md).toContain("- [ ] Define data model / schema");
      expect(md).toContain("- [ ] Implement API route / Convex function");
    });
  });

  describe("buildIssueBody", () => {
    const feature: ParsedFeature = {
      name: "Search",
      description: "Full-text search across listings",
      userStory: "As a buyer, I want to search listings so I can find what I need",
      priority: "P1",
      category: "fullstack",
      size: "L",
      acceptanceCriteria: [
        "Given a search query, When user submits, Then relevant results appear",
      ],
      dependencies: ["Listings"],
    };

    it("includes title and metadata", () => {
      const body = buildIssueBody(feature, 3, 10);
      expect(body).toContain("## Search");
      expect(body).toContain("P1");
      expect(body).toContain("fullstack");
      expect(body).toContain("4/10");
    });

    it("includes user story as blockquote", () => {
      const body = buildIssueBody(feature, 0, 1);
      expect(body).toContain("> As a buyer");
    });

    it("includes dependencies section", () => {
      const body = buildIssueBody(feature, 0, 1);
      expect(body).toContain("### Dependencies");
      expect(body).toContain("- Listings");
    });

    it("includes acceptance criteria as checkboxes", () => {
      const body = buildIssueBody(feature, 0, 1);
      expect(body).toContain("- [ ] Given a search query");
    });
  });

  describe("buildIssueLabels", () => {
    it("builds correct labels", () => {
      const feature: ParsedFeature = {
        name: "Test",
        description: "",
        userStory: "",
        priority: "P0",
        category: "frontend",
        size: "S",
        acceptanceCriteria: [],
        dependencies: [],
      };
      const labels = buildIssueLabels(feature);
      expect(labels).toContain("p0");
      expect(labels).toContain("frontend");
      expect(labels).toContain("size-s");
      expect(labels).toContain("feature");
    });
  });
});
