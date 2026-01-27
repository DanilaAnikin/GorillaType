import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Contact form API route.
 *
 * Receives contact form submissions and stores them in the
 * `contact_messages` Supabase table.
 *
 * Required table schema (run as a Supabase migration):
 *
 *   CREATE TABLE IF NOT EXISTS contact_messages (
 *     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     username TEXT NOT NULL DEFAULT 'Anonymous',
 *     subject TEXT NOT NULL,
 *     message TEXT NOT NULL,
 *     user_id UUID REFERENCES auth.users(id),
 *     created_at TIMESTAMPTZ DEFAULT now()
 *   );
 *
 *   -- Allow authenticated users to insert
 *   ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Anyone can insert contact messages"
 *     ON contact_messages FOR INSERT
 *     WITH CHECK (true);
 *
 * Recipient email: danakin1050@gmail.com
 * (Configure a Supabase database webhook or edge function to
 *  forward new rows to this address if email delivery is needed.)
 */

const CONTACT_EMAIL = 'danakin1050@gmail.com';

/**
 * POST /api/contact
 * Store a contact form submission in the database.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { username, subject, message } = body as {
      username?: string;
      subject?: string;
      message?: string;
    };

    // --- Validation ---
    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: 'Subject is required.' },
        { status: 400 },
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required.' },
        { status: 400 },
      );
    }

    if (subject.trim().length > 200) {
      return NextResponse.json(
        { error: 'Subject must be 200 characters or fewer.' },
        { status: 400 },
      );
    }

    if (message.trim().length > 5000) {
      return NextResponse.json(
        { error: 'Message must be 5 000 characters or fewer.' },
        { status: 400 },
      );
    }

    // --- Supabase client ---
    const supabase = await createClient();

    // Optionally grab the authenticated user (not required to submit).
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const resolvedUsername = username?.trim() || 'Anonymous';

    // --- Insert into contact_messages table ---
    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        username: resolvedUsername,
        subject: subject.trim(),
        message: message.trim(),
        user_id: user?.id ?? null,
      });

    if (insertError) {
      // If the table does not exist yet, log a helpful message and still
      // return a user-friendly response so the form does not break.
      console.error(
        '[/api/contact] Failed to insert contact message:',
        insertError,
      );
      console.info(
        `[/api/contact] Intended recipient: ${CONTACT_EMAIL}`,
      );
      console.info(
        '[/api/contact] Message payload:',
        JSON.stringify({ username: resolvedUsername, subject: subject.trim(), message: message.trim() }),
      );

      // Still return success to the user -- the message was logged on the
      // server side so it is not lost even if the table is missing.
      return NextResponse.json(
        {
          success: true,
          note: 'Your message has been received. We will get back to you soon.',
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        note: 'Your message has been sent. We will get back to you soon.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[/api/contact] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 },
    );
  }
}
