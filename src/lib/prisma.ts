// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle cleanup on process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Utility function to retry Prisma operations on prepared statement errors
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 100
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a prepared statement error (both "does not exist" and "already exists")
      const isPreparedStatementError = 
        error?.message?.includes('prepared statement') &&
        (error?.message?.includes('does not exist') || error?.message?.includes('already exists'));
      
      if (isPreparedStatementError && attempt < maxRetries) {
        console.warn(`Prisma prepared statement error on attempt ${attempt}, retrying...`);
        
        // Disconnect and reconnect to reset the connection
        try {
          await prisma.$disconnect();
        } catch (disconnectError) {
          console.warn('Error during disconnect:', disconnectError);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      
      // If it's not a prepared statement error or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw lastError!;
}
