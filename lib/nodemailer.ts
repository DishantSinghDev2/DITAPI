import nodemailer from "nodemailer"

let transporter: nodemailer.Transporter | null = null

export async function getEmailTransporter() {
  if (transporter) return transporter

  if (process.env.NODE_ENV === "production") {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } else {
    // Development - use ethereal email
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
  }

  return transporter
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  const transporter = await getEmailTransporter()
  const from = process.env.SMTP_FROM || "noreply@dishis.tech"

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    })
    console.log("[v0] Email sent:", info.response)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("[v0] Email error:", error)
    return { success: false, error }
  }
}
