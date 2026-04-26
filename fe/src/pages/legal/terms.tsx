import Head from "next/head";
import Link from "next/link";
import { Layout } from "@/components/layout/Layout";

const LAST_UPDATED = "April 26, 2026";

export default function TermsPage() {
  return (
    <Layout>
      <Head>
        <title>Terms of Service — funded.gr</title>
        <meta name="description" content="Terms of Service for funded.gr — Greek Startup Showcase." />
      </Head>

      <div className="max-w-3xl">
        <div className="mb-10">
          <p className="text-xs font-mono text-gray-400 mb-2">Last updated: {LAST_UPDATED}</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 text-sm">
            Please read these terms carefully before using funded.gr. By accessing or using the platform,
            you agree to be bound by these terms.
          </p>
        </div>

        <div className="prose-custom space-y-8">
          <Section title="1. About the Platform">
            <p>
              funded.gr is an online showcase platform that allows Greek startup founders to submit and
              present their projects to the community. The platform offers project listings, community
              engagement features, and AI-assisted evaluation of submitted projects.
            </p>
            <p>
              The platform is operated as a community resource. Visibility on funded.gr does not constitute
              an endorsement, recommendation, or financial advice of any kind regarding any project or company.
            </p>
          </Section>

          <Section title="2. Eligibility &amp; Registration">
            <p>
              You must be at least 18 years old to create an account. By registering, you confirm that the
              information you provide is accurate and complete. You are responsible for maintaining the
              security of your account credentials.
            </p>
            <p>
              One account per person. Creating multiple accounts to circumvent restrictions is prohibited
              and will result in permanent suspension.
            </p>
          </Section>

          <Section title="3. Project Submissions">
            <p>
              Each registered user may submit one project for review. Projects must meet the following
              requirements:
            </p>
            <ul>
              <li>Describe a real, existing project or startup — not a concept without substance</li>
              <li>Include accurate information about the project's current status</li>
              <li>Not promote illegal activity, fraudulent schemes, or misleading claims</li>
              <li>Not infringe on the intellectual property of third parties</li>
            </ul>
            <p>
              All submissions are subject to admin review before being published. We reserve the right to
              reject or remove any project that does not comply with these terms or that we deem
              inappropriate at our sole discretion.
            </p>
          </Section>

          <Section title="4. Content &amp; Intellectual Property">
            <p>
              You retain ownership of the content you submit. By posting on funded.gr, you grant us a
              non-exclusive, worldwide, royalty-free licence to display, reproduce, and distribute your
              submitted content solely for the purpose of operating and promoting the platform.
            </p>
            <p>
              You represent and warrant that you have the right to grant this licence and that your content
              does not infringe any third-party rights.
            </p>
            <p>
              The funded.gr name, logo, and platform design are our intellectual property. You may not use
              them without prior written permission.
            </p>
          </Section>

          <Section title="5. AI Evaluation">
            <p>
              The AI evaluation feature provides automated analysis of submitted projects based on the
              information you provide. Evaluation results are indicative only and do not constitute
              professional business, legal, or financial advice.
            </p>
            <p>
              Once an evaluation is completed, the project is locked for 30 days to preserve the integrity
              of the score. You acknowledge this lock period when requesting an evaluation.
            </p>
            <p>
              During the lock period, all editing and deletion of the project are disabled. After the
              lock expires you may update your project and request a new evaluation. There is no lifetime
              limit on evaluations, but only one evaluation cycle per 30-day period is permitted.
            </p>
            <p>
              All project fields — including name, tagline, description, vision, key features, category,
              status, and traction metrics — contribute to the evaluation score and are subject to the
              lock. Contact details and links are stored alongside your project but do not affect
              scoring; they remain editable whenever the project is not locked.
            </p>
          </Section>

          <Section title="6. Rejection &amp; Resubmission">
            <p>
              If your submission is rejected during admin review, you will receive a brief note explaining
              the reason. This note is visible only to you, in your project dashboard.
            </p>
            <p>
              You may address the feedback, edit your project accordingly, and resubmit for review at any
              time. Each resubmission restarts the admin review process. There is no limit on
              resubmissions; however, repeated bad-faith or unchanged resubmissions may result in account
              suspension at our discretion.
            </p>
            <p>
              Rejection does not affect a prior AI evaluation score. If your project had already received
              an evaluation before being rejected, that score remains on record and the 30-day lock
              period continues to apply.
            </p>
          </Section>

          <Section title="7. Prohibited Conduct">
            <p>You agree not to:</p>
            <ul>
              <li>Post false, misleading, or defamatory content</li>
              <li>Attempt to reverse-engineer, scrape, or disrupt the platform</li>
              <li>Use the platform to send unsolicited commercial messages</li>
              <li>Create accounts or submit projects on behalf of others without their consent</li>
              <li>Attempt to manipulate community metrics (likes, views) through automated means</li>
            </ul>
          </Section>

          <Section title="8. Disclaimer of Warranties">
            <p>
              funded.gr is provided "as is" and "as available" without warranties of any kind, either
              express or implied. We do not warrant that the platform will be uninterrupted, error-free,
              or free of harmful components.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, funded.gr and its operators shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages arising from
              your use of the platform, even if we have been advised of the possibility of such damages.
            </p>
          </Section>

          <Section title="10. Termination">
            <p>
              We reserve the right to suspend or terminate your account at any time for violation of these
              terms or for any other reason at our discretion. You may delete your account at any time by
              contacting us.
            </p>
          </Section>

          <Section title="11. Changes to These Terms">
            <p>
              We may update these Terms of Service from time to time. We will notify registered users of
              material changes by updating the "Last updated" date above. Continued use of the platform
              after changes constitutes acceptance of the revised terms.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These terms are governed by and construed in accordance with the laws of Greece, without
              regard to conflict of law principles. Any disputes arising from these terms or your use of
              the platform shall be subject to the exclusive jurisdiction of the courts of Athens, Greece.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              If you have any questions about these Terms, please{" "}
              <Link href="/contact" className="text-blue-600 hover:underline">contact us</Link>.
            </p>
          </Section>
        </div>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}
