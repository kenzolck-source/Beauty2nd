export type ListingStatus = "active" | "pending" | "inactive" | "sold" | "rejected";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface ListingImage {
  id: number;
  listingId: number;
  imageUrl: string;
  imageKey: string;
  sortOrder: number;
  createdAt: string;
}

export interface Listing {
  id: number;
  userId: number;
  categoryId: number;
  title: string;
  brand: string;
  model: string;
  condition: string;
  yearOfPurchase: number;
  price: number;
  negotiable: boolean;
  description: string;
  region: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactMethod: string;
  status: ListingStatus;
  viewCount: number;
  featuredImageUrl: string;
  images: ListingImage[];
  createdAt: string;
  updatedAt: string;
}

export interface Inquiry {
  id: number;
  listingId: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: "unread" | "read" | "replied";
  createdAt: string;
}

export interface ContactRequest {
  id: number;
  name: string;
  category: string;
  message: string;
  phone?: string;
  email?: string;
  status: "unread" | "read" | "replied";
  createdAt: string;
}
