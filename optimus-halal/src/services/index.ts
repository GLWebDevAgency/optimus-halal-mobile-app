/**
 * Services Index - Enterprise-grade Mobile App
 * 
 * Central export for all services
 * Netflix/Stripe/Shopify/Airbnb/Spotify standards
 * 
 * Architecture:
 * - gRPC: Direct communication with Mobile-Service (Rust BFF) - RECOMMENDED
 * - API: Legacy tRPC via API Gateway (deprecated for new features)
 */

// ============================================
// GRPC SERVICES (NEW - Direct to Mobile-Service)
// ============================================

export * from './grpc';

// ============================================
// API SERVICES (Legacy - via API Gateway)
// ============================================

export * from './api';
