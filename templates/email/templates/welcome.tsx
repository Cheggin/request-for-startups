/**
 * Welcome email template.
 *
 * Sent when a new user signs up. Built with React Email components
 * for consistent rendering across email clients.
 *
 * Preview: npx react-email dev
 *
 * @see https://react.email/docs
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  appName?: string;
  loginUrl?: string;
}

export function WelcomeEmail({
  name,
  appName = "YourApp",
  loginUrl = "https://yourdomain.com/sign-in",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {appName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Welcome to {appName}</Heading>

          <Text style={paragraph}>Hi {name},</Text>

          <Text style={paragraph}>
            Thanks for signing up. Your account is ready. You can start
            using {appName} right away.
          </Text>

          <Section style={buttonContainer}>
            <Link href={loginUrl} style={button}>
              Go to Dashboard
            </Link>
          </Section>

          <Text style={paragraph}>
            If you have any questions, reply to this email. We read every
            message.
          </Text>

          <Text style={footer}>
            — The {appName} team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

// ---------------------------------------------------------------------------
// Styles (inline for email client compatibility)
// ---------------------------------------------------------------------------

const body = {
  backgroundColor: "#f9fafb",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: "0",
  padding: "0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  margin: "40px auto",
  maxWidth: "480px",
  padding: "40px 32px",
};

const heading = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "700" as const,
  lineHeight: "1.3",
  margin: "0 0 24px",
};

const paragraph = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#111827",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600" as const,
  padding: "12px 24px",
  textDecoration: "none",
};

const footer = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "32px 0 0",
};
