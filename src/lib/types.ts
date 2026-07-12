export type Role = "member" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  specialty: string | null;
  gmc_number: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface EventType {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  duration_minutes: number;
  format: "one_to_one" | "group";
  min_group_size: number;
  default_capacity: number;
  requires_portfolio: boolean;
  portfolio_lead_days: number;
  price_gbp: number | null;
  color: string | null;
  sort_order: number;
  active: boolean;
}

export interface CoachEvent {
  id: string;
  event_type_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  location: string;
  meeting_url: string | null;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
  coach_event_types?: EventType;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  event_id: string;
  user_id: string;
  status: BookingStatus;
  portfolio_url: string | null;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  coach_events?: CoachEvent;
  coach_profiles?: Profile;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  duration_minutes: number | null;
  sort_order: number;
  published: boolean;
  created_at: string;
}

export interface Doc {
  id: string;
  title: string;
  description: string | null;
  file_path: string | null;
  external_url: string | null;
  category: string;
  file_size_kb: number | null;
  sort_order: number;
  published: boolean;
  created_at: string;
}

export interface Consultant {
  id: string;
  name: string;
  title: string | null;
  specialty: string | null;
  bio: string | null;
  photo_url: string | null;
  sort_order: number;
  active: boolean;
}

export interface Setting {
  key: string;
  value: Record<string, unknown>;
  is_public: boolean;
}
