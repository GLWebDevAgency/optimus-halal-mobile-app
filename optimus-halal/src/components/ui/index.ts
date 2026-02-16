/**
 * UI Components Index
 * 
 * Export centralisé de tous les composants UI
 */

export { Button, type ButtonProps } from "./Button";
export { Input, type InputProps } from "./Input";
export { PhoneInput, type PhoneInputProps, type CountryCode, COUNTRY_CODES, validateFrenchPhone, getFullPhoneNumber, parseInternationalPhone } from "./PhoneInput";
export { LocationPicker, type LocationPickerProps } from "./LocationPicker";
export { Card, CardHeader, CardContent, CardFooter, type CardProps } from "./Card";
export { Badge, CertificationBadge, type BadgeProps, type CertificationBadgeProps } from "./Badge";
export { IconButton, type IconButtonProps } from "./IconButton";
export { Avatar, AvatarGroup, type AvatarProps, type AvatarGroupProps } from "./Avatar";
export { Chip, ChipGroup, type ChipProps, type ChipGroupProps } from "./Chip";
export { PageIndicator, AnimatedPageIndicator, type PageIndicatorProps, type AnimatedPageIndicatorProps } from "./PageIndicator";
export { Skeleton, SkeletonText, SkeletonCard, SkeletonList, type SkeletonProps, type SkeletonTextProps, type SkeletonCardProps, type SkeletonListProps } from "./Skeleton";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { OfflineBanner } from "./OfflineBanner";
