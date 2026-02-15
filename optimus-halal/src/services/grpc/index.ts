/**
 * gRPC Services Index
 * 
 * Centralized exports for all gRPC-Web services
 * Direct communication with Mobile-Service (Rust BFF) via gRPC-Web
 * 
 * Architecture: React Native → gRPC-Web (HTTP/1.1) → Mobile-Service → PostgreSQL/Redis
 * 
 * Usage:
 * ```typescript
 * import { authService, profileService, scanService } from '@/services/grpc';
 * 
 * // Initialize on app startup
 * await authService.initialize();
 * 
 * // Use services
 * const auth = await authService.login({ email, password });
 * const profile = await profileService.getProfile({ userId: auth.user.userId });
 * const scanResult = await scanService.scanBarcode({ barcode: '3017620422003' });
 * ```
 */

// Configuration
export * from './config';

// Client & utilities (GrpcStatus already exported from config)
export { grpcClient, tokenManager, GrpcApiError } from './client';
export type { GrpcError, GrpcMetadata, CallOptions } from './client';

// Types (generated from proto)
export * from './types';

// Services
export { authService } from './auth.service';
export { profileService } from './profile.service';
export { scanService } from './scan.service';
export { favoritesService } from './favorites.service';
export { storeService } from './store.service';
export { notificationService } from './notification.service';
export { alertService } from './alert.service';
export { reportService } from './report.service';

/**
 * Initialize all gRPC services
 * Call this on app startup
 */
export async function initializeGrpcServices(): Promise<void> {
  const { authService: auth } = await import('./auth.service');
  await auth.initialize();
}

/**
 * Service health check
 * Returns true if all services are reachable
 */
export async function checkServicesHealth(): Promise<boolean> {
  try {
    // Simple health check by validating config
    const { getGrpcConfig } = await import('./config');
    const config = getGrpcConfig();
    
    // Try to reach the server with a simple fetch
    const response = await fetch(`${config.host}/health`, {
      method: 'GET',
      headers: { 'Accept': 'text/plain' },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
