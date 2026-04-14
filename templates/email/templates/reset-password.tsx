/**
 * Password reset email template.
 *
 * Sent when a user requests a password reset.
 * Contains a time-limited reset link.
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

interface ResetPasswordEmailProps {
  name: string;
  resetUrl: string;
  appName?: string;
  expiresInMinutes?: number;
}

export function ResetPasswordEmail({
  name,
  resetUrl,
  appName = "YourApp",
  expiresInMinutes = 60,
}: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your {appName} password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Reset your password</Heading>

          <Text style={paragraph}>Hi {name},</Text>

          <Text style={paragraph}>
            We received a request to reset your {appName} password. Click the
            button below to choose a new one.
          </Text>

          <Section style={buttonContainer}>
            <Link href={resetUrl} style={button}>
              Reset Password
            </Link>
          </Section>

          <Text style={smallText}>
            This link expires in {expiresInMinutes} minutes. If you did not
            request a password reset, you can safely ignore this email. Your
            password will not change.
          </Text>

          <Text style={footer}>
            — The {appName} team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;

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
  backgroundColor: "#dc2626",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600" as const,
  padding: "12px 24px",
  textDecoration: "none",
};

const smallText = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const footer = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "32px 0 0",
};
