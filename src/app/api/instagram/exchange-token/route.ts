import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    // Exchange the code for a long-lived access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID!,
        client_secret: process.env.INSTAGRAM_APP_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI!,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange token with Instagram');
    }

    const { access_token, user_id } = await tokenResponse.json();

    // Exchange short-lived token for long-lived token
    const longLivedTokenResponse = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${access_token}`);

    if (!longLivedTokenResponse.ok) {
      throw new Error('Failed to get long-lived token');
    }

    const { access_token: long_lived_token } = await longLivedTokenResponse.json();

    return NextResponse.json({
      access_token: long_lived_token,
      user_id,
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { error: 'Failed to exchange Instagram token' },
      { status: 500 }
    );
  }
} 