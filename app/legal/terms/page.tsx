export default function TermsPage() {
  return (
    <div className="container py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="prose prose-sm max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using DITAPI ("Platform"), you accept and agree to be bound by the terms and provision of
            this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on DITAPI
            for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of
            title, and under this license you may not:
          </p>
          <ul className="list-disc ml-6 mt-2">
            <li>Modifying or copying the materials</li>
            <li>Using the materials for any commercial purpose or for any public display</li>
            <li>Attempting to reverse engineer any software contained on DITAPI</li>
            <li>Removing any copyright or other proprietary notations from the materials</li>
            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Disclaimer</h2>
          <p>
            The materials on DITAPI are provided on an 'as is' basis. DITAPI makes no warranties, expressed or implied,
            and hereby disclaims and negates all other warranties including, without limitation, implied warranties or
            conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual
            property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Limitations</h2>
          <p>
            In no event shall DITAPI or its suppliers be liable for any damages (including, without limitation, damages
            for loss of data or profit, or due to business interruption) arising out of the use or inability to use the
            materials on DITAPI.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Accuracy of Materials</h2>
          <p>
            The materials appearing on DITAPI could include technical, typographical, or photographic errors. DITAPI
            does not warrant that any of the materials on its Platform are accurate, complete, or current.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Links</h2>
          <p>
            DITAPI has not reviewed all of the sites linked to its Platform and is not responsible for the contents of
            any such linked site. The inclusion of any link does not imply endorsement by DITAPI of the site. Use of any
            such linked website is at the user's own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Modifications</h2>
          <p>
            DITAPI may revise these terms of service for its Platform at any time without notice. By using this
            Platform, you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction
            where DishIs Technologies operates, and you irrevocably submit to the exclusive jurisdiction of the courts
            in that location.
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-8">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  )
}
