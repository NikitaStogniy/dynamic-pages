import cron from 'node-cron';
import { db, cronJobs } from '@/lib/db';
import { eq } from 'drizzle-orm';

const runningJobs = new Map<string, cron.ScheduledTask>();

export function initializeCronJobs() {
  console.log('Initializing cron jobs...');

  // Cleanup job removed - no longer needed without isPublished field
  // Pages are now always accessible if the slug is known

  const healthCheck = cron.schedule('*/5 * * * *', async () => {
    console.log('Health check ping at', new Date().toISOString());
    
    await db
      .update(cronJobs)
      .set({ 
        lastRun: new Date(),
        nextRun: getNextRunTime('*/5 * * * *')
      })
      .where(eq(cronJobs.name, 'health_check'));
  });

  runningJobs.set('health_check', healthCheck);

  console.log('Cron jobs initialized successfully');
}

export function stopCronJob(jobName: string) {
  const job = runningJobs.get(jobName);
  if (job) {
    job.stop();
    runningJobs.delete(jobName);
    console.log(`Stopped cron job: ${jobName}`);
  }
}

export function startCronJob(jobName: string, schedule: string, task: () => void) {
  stopCronJob(jobName);
  
  const job = cron.schedule(schedule, task);
  runningJobs.set(jobName, job);
  console.log(`Started cron job: ${jobName} with schedule: ${schedule}`);
}

export function validateCronExpression(expression: string): boolean {
  return cron.validate(expression);
}

function getNextRunTime(cronExpression: string): Date {
  const interval = cron.schedule(cronExpression, () => {});
  const nextRun = new Date();
  
  interval.stop();
  
  return nextRun;
}

export function stopAllCronJobs() {
  runningJobs.forEach((job, name) => {
    job.stop();
    console.log(`Stopped cron job: ${name}`);
  });
  runningJobs.clear();
}