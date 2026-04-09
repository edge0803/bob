import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { freeInput, time, mood } = await request.json();

    // TODO: Implement Claude API call
    // For now, return a mock response
    const mockVideo = {
      id: "mock-id",
      title: "Claude 추천 영상",
      time,
      mood,
      thumbnail: "/images/placeholder.png",
      url: "https://youtu.be/placeholder"
    };

    return NextResponse.json({ video: mockVideo });
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json({ error: 'Failed to get recommendation' }, { status: 500 });
  }
}