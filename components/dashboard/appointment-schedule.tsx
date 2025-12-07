'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppointmentCard } from './appointment-card';
import { AppointmentScheduleSkeleton } from './Skeleton';
import { Calendar, ChevronRight, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCleanerCache } from '@/lib/hooks/use-cleaner-cache';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Booking, Cleaner } from '@/types/dashboard';

interface AppointmentScheduleProps {
  bookings: Booking[];
  isLoading?: boolean;
  onReschedule?: (bookingId: string) => void;
  onCancel?: () => void;
  onBookingUpdate?: (updatedBookings: Booking[]) => void; // Callback for optimistic updates
}

// Sortable appointment card wrapper
const SortableAppointmentCard = memo(function SortableAppointmentCard({
  booking,
  index,
  cleaners,
  onReschedule,
  onCancel,
  onBookingUpdate,
  bookings,
}: {
  booking: Booking;
  index: number;
  cleaners: Record<string, Cleaner>;
  onReschedule?: (bookingId: string) => void;
  onCancel?: () => void;
  onBookingUpdate?: (updatedBookings: Booking[]) => void;
  bookings: Booking[];
}) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: booking.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleReschedule = useCallback(() => {
    if (onReschedule) {
      onReschedule(booking.id);
    } else {
      router.push(`/booking/reschedule?id=${booking.id}`);
    }
  }, [onReschedule, router, booking.id]);

  return (
    <div ref={setNodeRef} style={style} className="relative group min-w-0">
      <button
        {...attributes}
        {...listeners}
        className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white shadow-sm border border-gray-200"
        aria-label={`Drag to reorder ${booking.service_type} booking`}
        type="button"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <AppointmentCard
          id={booking.id}
          date={booking.booking_date}
          time={booking.booking_time}
          serviceType={booking.service_type}
          address={`${booking.address_line1}, ${booking.address_suburb}, ${booking.address_city}`}
          cleaner={booking.cleaner_id ? cleaners[booking.cleaner_id] : null}
          onReschedule={handleReschedule}
          onCancel={onCancel}
          onOptimisticCancel={(bookingId) => {
            if (onBookingUpdate) {
              const updatedBookings = bookings.filter(b => b.id !== bookingId);
              onBookingUpdate(updatedBookings);
            }
          }}
        />
      </motion.div>
    </div>
  );
});

export const AppointmentSchedule = memo(function AppointmentSchedule({ bookings, isLoading = false, onReschedule, onCancel, onBookingUpdate }: AppointmentScheduleProps) {
  const router = useRouter();
  const { fetchMultipleCleaners } = useCleanerCache();
  const [cleaners, setCleaners] = useState<Record<string, Cleaner>>({});
  const [orderedBookings, setOrderedBookings] = useState<Booking[]>([]);

  // Memoize upcoming bookings calculation
  const upcomingBookings = useMemo(() => {
    return bookings
      .filter(b => {
        const bookingDate = new Date(b.booking_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Exclude cancelled bookings
        if (b.status === 'cancelled' || b.status === 'canceled') {
          return false;
        }
        return bookingDate >= today;
      })
      .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime())
      .slice(0, 3); // Show top 3
  }, [bookings]);

  // Initialize ordered bookings from localStorage or default order
  useEffect(() => {
    if (upcomingBookings.length === 0) return;

    const storageKey = 'dashboard_booking_order';
    const savedOrder = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    
    if (savedOrder) {
      try {
        const savedIds = JSON.parse(savedOrder) as string[];
        // Filter to only include IDs that still exist in upcomingBookings
        const validIds = savedIds.filter(id => upcomingBookings.some(b => b.id === id));
        // Add any new bookings that weren't in saved order
        const newIds = upcomingBookings
          .filter(b => !validIds.includes(b.id))
          .map(b => b.id);
        
        const orderedIds = [...validIds, ...newIds];
        const ordered = orderedIds
          .map(id => upcomingBookings.find(b => b.id === id))
          .filter((b): b is Booking => !!b);
        
        // Fill in any missing bookings
        upcomingBookings.forEach(b => {
          if (!ordered.find(ob => ob.id === b.id)) {
            ordered.push(b);
          }
        });
        
        setOrderedBookings(ordered);
      } catch {
        setOrderedBookings(upcomingBookings);
      }
    } else {
      setOrderedBookings(upcomingBookings);
    }
  }, [upcomingBookings]);

  // Save order to localStorage when it changes
  useEffect(() => {
    if (orderedBookings.length === 0) return;
    
    const storageKey = 'dashboard_booking_order';
    const ids = orderedBookings.map(b => b.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(ids));
    }
  }, [orderedBookings]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedBookings((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // Fetch cleaner details using shared cache
  useEffect(() => {
    const fetchCleaners = async () => {
      const cleanerIds = bookings
        .map(b => b.cleaner_id)
        .filter((id): id is string => !!id);

      if (cleanerIds.length === 0) return;

      const cleanerMap = await fetchMultipleCleaners(cleanerIds);
      setCleaners(cleanerMap);
    };

    fetchCleaners();
  }, [bookings, fetchMultipleCleaners]);


  if (isLoading) {
    return <AppointmentScheduleSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-white to-teal-50/30 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 px-3 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base lg:text-lg">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 flex-shrink-0" />
            <span className="truncate">Upcoming Appointments</span>
          </CardTitle>
          {bookings.length > 3 && (
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex flex-shrink-0">
              <Link href="/dashboard/bookings" className="text-[10px] sm:text-xs">
                View All <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-4 sm:pb-6 min-w-0">
          <AnimatePresence mode="wait">
            {upcomingBookings.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4">No upcoming appointments</p>
                <Button asChild className="text-sm sm:text-base h-10 sm:h-11">
                  <Link href="/booking/service/select">Book a Service</Link>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="bookings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={orderedBookings.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2.5 sm:space-y-4 min-w-0">
                      {orderedBookings.map((booking, index) => (
                        <SortableAppointmentCard
                          key={booking.id}
                          booking={booking}
                          index={index}
                          cleaners={cleaners}
                          onReschedule={onReschedule}
                          onCancel={onCancel}
                          onBookingUpdate={onBookingUpdate}
                          bookings={bookings}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {bookings.length > 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="pt-2"
                  >
                    <Button variant="outline" className="w-full h-9 sm:h-10 text-xs sm:text-sm touch-manipulation" asChild>
                      <Link href="/dashboard/bookings">View All Appointments</Link>
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
});
