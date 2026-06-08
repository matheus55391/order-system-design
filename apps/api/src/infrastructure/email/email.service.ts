import { Injectable } from "@nestjs/common";
import nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
  });

  private readonly from =
    process.env.SMTP_FROM ?? "noreply@order-system.local";

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Recuperação de senha — Order System",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#f97316;">Order System</h2>
          <p>Recebemos uma solicitação para redefinir sua senha.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#000;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Redefinir senha</a></p>
          <p style="color:#666;font-size:14px;">O link expira em 1 hora. Se não foi você, ignore este e-mail.</p>
          <p style="color:#999;font-size:12px;word-break:break-all;">${resetUrl}</p>
        </div>
      `,
      text: `Redefina sua senha: ${resetUrl}\n\nO link expira em 1 hora.`,
    });
  }
}
