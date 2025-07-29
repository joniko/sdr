import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        email_templates (
          name,
          subject_template
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: campaigns, error, count } = await query;

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    return NextResponse.json({
      campaigns: campaigns || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, template_id, automation_rules } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    // Create campaign
    const supabaseAdmin = getSupabaseAdmin();
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .insert({
        name,
        description,
        template_id,
        status: 'draft',
        user_id: 'current_user' // In real app, get from auth
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Error creating campaign:', campaignError);
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    // Create automation rules if provided
    if (automation_rules && automation_rules.length > 0) {
      const rulesWithCampaignId = automation_rules.map((rule: any) => ({
        ...rule,
        campaign_id: campaign.id,
        user_id: 'current_user'
      }));

      const { error: rulesError } = await supabaseAdmin
        .from('automation_rules')
        .insert(rulesWithCampaignId);

      if (rulesError) {
        console.error('Error creating automation rules:', rulesError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 