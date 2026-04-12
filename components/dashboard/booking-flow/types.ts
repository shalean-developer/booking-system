export interface BookingStep {
  id: number;
  label: string;
}

export interface FlowService {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
}

export interface FlowCleaner {
  id: string;
  name: string;
  initial: string;
  specialty: string;
  rating: string;
  reviews: string;
}

export interface FlowTimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface FlowExtra {
  id: string;
  name: string;
  price: string;
}
