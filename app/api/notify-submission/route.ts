import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const {
      boothOwnerEmail,
      boothOwnerName,
      coupleName,
      guestName,
      message,
      hasMedia,
    } = await request.json();

    if (!boothOwnerEmail || !coupleName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">💕 New Guest Submission</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone just left a message for ${coupleName}!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; margin-bottom: 10px;">Message Details</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong>From:</strong> ${guestName || "Anonymous"}
              </p>
              <p style="margin: 0 0 15px 0; color: #666;">
                <strong>Message:</strong>
              </p>
              <p style="margin: 0; color: #333; line-height: 1.6; font-style: italic;">
                "${message}"
              </p>
              ${hasMedia ? '<p style="margin: 10px 0 0 0; color: #667eea;"><strong>📎 Includes photo or video</strong></p>' : ""}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/guestbook" 
               style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View All Messages
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
            <p>This is an automated notification from Love Lens</p>
            <p>You can manage your notification preferences in your booth settings.</p>
          </div>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "Love Lens <onboarding@resend.dev>", // Use sandbox domain for testing
      to: [boothOwnerEmail],
      subject: `New message for ${coupleName} from ${guestName || "Anonymous"}`,
      html: emailContent,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Email notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
