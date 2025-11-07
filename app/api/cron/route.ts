import { NextRequest, NextResponse } from 'next/server';
import { initializeCronJobs, stopAllCronJobs, validateCronExpression } from '@/lib/cron/jobs';
import { db, cronJobs, NewCronJob } from '@/lib/db';
import { eq } from 'drizzle-orm';

let cronInitialized = false;

export async function GET() {
  try {
    const allJobs = await db.query.cronJobs.findMany();
    return NextResponse.json({ jobs: allJobs });
  } catch (error) {
    console.error('Error fetching cron jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cron jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, name, schedule } = await request.json();

    if (action === 'initialize' && !cronInitialized) {
      initializeCronJobs();
      cronInitialized = true;
      
      const defaultJobs: NewCronJob[] = [
        {
          name: 'cleanup_old_pages',
          schedule: '0 0 * * *',
          isActive: true,
        },
        {
          name: 'health_check',
          schedule: '*/5 * * * *',
          isActive: true,
        },
      ];

      for (const job of defaultJobs) {
        const existing = await db.query.cronJobs.findFirst({
          where: eq(cronJobs.name, job.name),
        });

        if (!existing) {
          await db.insert(cronJobs).values(job);
        }
      }

      return NextResponse.json({ message: 'Cron jobs initialized' });
    }

    if (action === 'stop') {
      stopAllCronJobs();
      cronInitialized = false;
      return NextResponse.json({ message: 'All cron jobs stopped' });
    }

    if (action === 'create') {
      if (!name || !schedule) {
        return NextResponse.json(
          { error: 'Name and schedule are required' },
          { status: 400 }
        );
      }

      if (!validateCronExpression(schedule)) {
        return NextResponse.json(
          { error: 'Invalid cron expression' },
          { status: 400 }
        );
      }

      const newJob: NewCronJob = {
        name,
        schedule,
        isActive: true,
      };

      const [created] = await db.insert(cronJobs).values(newJob).returning();
      return NextResponse.json({ job: created });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error managing cron jobs:', error);
    return NextResponse.json(
      { error: 'Failed to manage cron jobs' },
      { status: 500 }
    );
  }
}