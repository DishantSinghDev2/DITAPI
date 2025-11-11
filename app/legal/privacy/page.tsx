export default function PrivacyPage() {
  return (
    <div className="container py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, subscribe to APIs, or
            contact us for support. This may include:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>Name and email address</li>
            <li>Account credentials</li>
            <li>Billing information</li>
            <li>Communication preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>Provide, maintain, and improve our Platform</li>
            <li>Process transactions and send related information</li>
            <li>Send promotional communications (with your consent)</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Monitor and analyze trends, usage, and activities</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against
            unauthorized access, alteration, disclosure, or destruction. However, no security system is impenetrable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide you
            services. You can request deletion of your data at any time through your account settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Third-Party Links</h2>
          <p>
            Our Platform may contain links to third-party websites. We are not responsible for the privacy practices of
            those websites. We encourage you to review their privacy policies before providing personal information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@dishis.tech or through our
            support ticketing system.
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-8">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  )
}
