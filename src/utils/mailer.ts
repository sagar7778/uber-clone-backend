import nodemailer from 'nodemailer'

const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const mailFrom = process.env.MAIL_FROM || (smtpUser || '')

export const sendMail = async (to: string, subject: string, html: string) => {
  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP_USER and SMTP_PASS are required')
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass }
  })

  return transporter.sendMail({ from: mailFrom, to, subject, html })
}


