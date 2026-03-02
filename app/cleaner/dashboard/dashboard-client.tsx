'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, ClipboardList, User, Wallet, Bell, ChevronRight, Search, CheckCircle2, Clock, MapPin, DollarSign, TrendingUp, Award, Star, Phone, Mail, Camera, Edit2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
type BookingStatus = 'upcoming' | 'completed' | 'cancelled';
type PageView = 'Dashboard' | 'Jobs' | 'Schedule' | 'Profile' | 'Earnings';
interface Booking {
  id: string;
  clientName: string;
  address: string;
  time: string;
  date: string;
  status: BookingStatus;
  earnings: number;
  serviceType: string;
}
interface ScheduleEvent {
  id: string;
  date: string;
  time: string;
  clientName: string;
  address: string;
  duration: string;
}
interface EarningsRecord {
  id: string;
  date: string;
  clientName: string;
  amount: number;
  status: 'paid' | 'pending';
  booking_date?: string; // Original date for filtering
}

interface DatabaseBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  status: string;
  total_amount?: number;
  cleaner_earnings?: number;
  address_line1?: string;
  address_suburb?: string;
  address_city?: string;
  customer_name?: string;
  customer_phone?: string;
}

interface DatabaseEarnings {
  id: string;
  booking_date: string;
  customer_name?: string;
  cleaner_earnings?: number;
  tip_amount?: number;
}

// Data transformation helpers
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) return 'Today';
    if (compareDate.getTime() === yesterday.getTime()) return 'Yesterday';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  } catch {
    return timeStr;
  }
};

const formatTimeRange = (timeStr: string): string => {
  const formatted = formatTime(timeStr);
  // Estimate duration - could be improved with actual booking duration
  const hour = parseInt(timeStr.split(':')[0], 10);
  const endHour = (hour + 2) % 24;
  const endTime = `${endHour.toString().padStart(2, '0')}:${timeStr.split(':')[1]}`;
  const endFormatted = formatTime(endTime);
  return `${formatted} - ${endFormatted}`;
};

const combineAddress = (line1?: string, suburb?: string, city?: string): string => {
  const parts = [line1, suburb, city].filter(Boolean);
  return parts.join(', ') || 'Address not provided';
};

const mapStatus = (dbStatus: string): BookingStatus => {
  const upcomingStatuses = ['pending', 'accepted', 'on_my_way', 'in-progress'];
  if (upcomingStatuses.includes(dbStatus)) return 'upcoming';
  if (dbStatus === 'completed') return 'completed';
  return 'cancelled';
};

const transformBooking = (db: DatabaseBooking, estimateEarnings = true): Booking => {
  // Check if service type is Deep Clean, Move In/Out, or Carpet Clean - fixed R250
  const serviceTypeLower = (db.service_type || '').toLowerCase();
  const isFixedRateService = 
    serviceTypeLower.includes('deep') || 
    serviceTypeLower.includes('move') || 
    serviceTypeLower.includes('carpet');
  
  let earnings: number;
  
  if (isFixedRateService) {
    // Fixed R250 for Deep Clean, Move In/Out, and Carpet Clean
    earnings = 250;
  } else if (!estimateEarnings && db.cleaner_earnings) {
    // Use actual cleaner_earnings from database (in cents, convert to Rands)
    earnings = db.cleaner_earnings / 100;
  } else {
    // Estimate as 70% of total amount
    earnings = db.total_amount ? (db.total_amount / 100) * 0.7 : 0;
  }
  
  return {
    id: db.id,
    clientName: db.customer_name || 'Unknown Client',
    address: combineAddress(db.address_line1, db.address_suburb, db.address_city),
    time: formatTimeRange(db.booking_time),
    date: formatDate(db.booking_date),
    status: mapStatus(db.status),
    earnings,
    serviceType: db.service_type || 'Standard Cleaning',
  };
};

const transformScheduleEvent = (db: DatabaseBooking): ScheduleEvent => {
  return {
    id: db.id,
    date: db.booking_date,
    time: db.booking_time,
    clientName: db.customer_name || 'Unknown Client',
    address: combineAddress(db.address_line1, db.address_suburb, db.address_city) || 'Address not provided',
    duration: '2h', // Default duration - could be improved
  };
};

const transformEarnings = (db: DatabaseEarnings): EarningsRecord => {
  const totalEarnings = ((db.cleaner_earnings || 0) / 100);
  return {
    id: db.id,
    date: formatDate(db.booking_date),
    booking_date: db.booking_date, // Keep original for filtering
    clientName: db.customer_name || 'Unknown Client',
    amount: totalEarnings,
    status: 'paid', // Completed bookings are considered paid
  };
};

// Dashboard Page Component
const DashboardPage = ({ bookings, isLoading }: { bookings: Booking[]; isLoading: boolean }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.date === 'Today');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  
  // Calculate week stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date === 'Today' ? today : b.date === 'Yesterday' ? new Date(Date.now() - 86400000).toISOString().split('T')[0] : b.date);
    return bookingDate >= weekStart;
  });
  const weekCompleted = weekBookings.filter(b => b.status === 'completed');
  
  const stats = [{
    title: 'Today\'s Jobs',
    value: todayBookings.length.toString(),
    subtitle: `${todayBookings.filter(b => b.status === 'completed').length} completed`,
    icon: Calendar,
    color: 'bg-blue-500'
  }, {
    title: 'This Week',
    value: weekBookings.length.toString(),
    subtitle: `${weekBookings.length - weekCompleted.length} remaining`,
    icon: Clock,
    color: 'bg-amber-500'
  }, {
    title: 'Completed',
    value: completedBookings.length.toString(),
    subtitle: 'Total jobs',
    icon: CheckCircle2,
    color: 'bg-emerald-500'
  }, {
    title: 'This Month',
    value: `R${completedBookings.reduce((sum, b) => sum + b.earnings, 0).toFixed(0)}`,
    subtitle: 'Total earnings',
    icon: Wallet,
    color: 'bg-indigo-600'
  }] as any[];

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return <div className="space-y-6 pb-24">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Welcome back!</h2>
            <p className="text-blue-100 text-sm mt-1">{dateStr}</p>
          </div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Award className="text-white" size={28} />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="bg-white h-full w-[75%]"></div>
          </div>
          <span className="text-sm font-semibold">75%</span>
        </div>
        <p className="text-xs text-blue-100 mt-2">Weekly goal: 3 more jobs to reach target</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => <motion.div key={idx} whileTap={{
        scale: 0.95
      }} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className={`w-10 h-10 ${stat.color} bg-opacity-10 rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon size={20} className={stat.color.replace('bg-', 'text-')} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.subtitle}</div>
          </motion.div>)}
      </div>

      {/* Today's Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Today's Jobs</h3>
          <button className="text-blue-600 text-sm font-semibold">View All</button>
        </div>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : todayBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No jobs scheduled for today</div>
        ) : (
          <div className="space-y-3">
            {todayBookings.map(booking => <motion.div key={booking.id} whileTap={{
          scale: 0.98
        }} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {booking.clientName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{booking.clientName}</h4>
                    <p className="text-xs text-gray-500">{booking.serviceType}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                  Upcoming
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Clock size={14} className="text-gray-400" />
                <span>{booking.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <MapPin size={14} className="text-gray-400" />
                <span className="flex-1 truncate">{booking.address}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-emerald-600 font-bold">R{booking.earnings.toFixed(2)}</span>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
                  Start Job
                </button>
              </div>
            </motion.div>)}
          </div>
        )}
      </div>

      {/* Performance Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Your Performance</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Rating</span>
              <div className="flex items-center gap-1">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="font-bold text-gray-900">4.9</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full w-[98%]"></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Reliability</span>
              <span className="font-bold text-gray-900">100%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[100%]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};

// Jobs Page Component
const JobsPage = ({ bookings, isLoading }: { bookings: Booking[]; isLoading: boolean }) => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  return <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'upcoming', 'completed'].map(f => <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${filter === f ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>)}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No bookings found</div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map(booking => <motion.div key={booking.id} layout initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                  {booking.clientName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{booking.clientName}</h4>
                  <p className="text-xs text-gray-500">{booking.serviceType}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.status === 'upcoming' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} className="text-gray-400" />
                <span>{booking.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={14} className="text-gray-400" />
                <span>{booking.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="text-gray-400" />
                <span className="flex-1">{booking.address}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-emerald-600 font-bold text-lg">R{booking.earnings.toFixed(2)}</span>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold">
                View Details
              </button>
            </div>
          </motion.div>)}
        </div>
      )}
    </div>;
};

// Schedule Page Component
const SchedulePage = ({ scheduleEvents, isLoading }: { scheduleEvents: ScheduleEvent[]; isLoading: boolean }) => {
  const groupedSchedule = scheduleEvents.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, ScheduleEvent[]>);

  const now = new Date();
  const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  return <div className="space-y-6 pb-24">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
          <h3 className="font-bold text-lg">{currentMonth}</h3>
          <p className="text-sm text-blue-100">Your weekly schedule</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="text-center text-xs font-semibold text-gray-500">
                {day}
              </div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({
            length: 35
          }, (_, i) => {
            // Check if date has events
            const dayOfMonth = i - 9;
            const dateKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(dayOfMonth).padStart(2, '0');
            const hasEvent = dayOfMonth > 0 && dayOfMonth <= 31 && groupedSchedule[dateKey] && groupedSchedule[dateKey].length > 0;
            const isToday = dayOfMonth === now.getDate();
            
            return <div key={i} className={`aspect-square flex items-center justify-center text-sm rounded-xl ${isToday ? 'bg-blue-600 text-white font-bold' : hasEvent ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-400'}`}>
                  {dayOfMonth > 0 && dayOfMonth <= 31 ? dayOfMonth : ''}
                </div>;
          })}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Schedule</h3>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading schedule...</div>
        ) : Object.keys(groupedSchedule).length === 0 ? (
          <div className="text-center py-8 text-gray-500">No upcoming schedule</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedSchedule).map(([date, events]) => <div key={date}>
              <div className="text-sm font-semibold text-gray-500 mb-2">
                {new Date(date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}
              </div>
              <div className="space-y-2">
                {events.map(event => <motion.div key={event.id} whileTap={{
              scale: 0.98
            }} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{event.time.split(':')[0]}</div>
                        <div className="text-xs text-gray-500">{event.time.split(':')[1]}</div>
                      </div>
                      <div className="flex-1 border-l-2 border-blue-600 pl-4">
                        <h4 className="font-bold text-gray-900">{event.clientName}</h4>
                        <p className="text-sm text-gray-600 mt-1">{event.address}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{event.duration}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>)}
              </div>
            </div>)}
          </div>
        )}
      </div>

      <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg">
        <Plus size={20} />
        Add Availability
      </button>
    </div>;
};

// Profile Page Component
const ProfilePage = ({ cleanerRating, totalJobs }: { cleanerRating?: number; totalJobs?: number }) => {
  const [profileData, setProfileData] = useState<{
    name: string;
    phone: string;
    email: string;
    photo_url: string | null;
    years_experience: number;
    specialties: string[];
    areas: string[];
  } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const [personalInfoRes, profileRes] = await Promise.all([
          fetch('/api/cleaner/personal-info', { credentials: 'include' }),
          fetch('/api/cleaner/cleaner-profile', { credentials: 'include' }),
        ]);

        const personalInfoData = await personalInfoRes.json();
        const profileData = await profileRes.json();

        if (personalInfoData.ok && profileData.ok) {
          setProfileData({
            name: personalInfoData.personal_info?.name || '',
            phone: personalInfoData.personal_info?.phone || '',
            email: personalInfoData.personal_info?.email || '',
            photo_url: personalInfoData.personal_info?.photo_url || null,
            years_experience: profileData.profile?.years_experience || 0,
            specialties: Array.isArray(profileData.profile?.specialties) 
              ? profileData.profile.specialties 
              : (profileData.profile?.specialties ? [profileData.profile.specialties] : []),
            areas: Array.isArray(profileData.profile?.areas) 
              ? profileData.profile.areas 
              : (profileData.profile?.areas ? [profileData.profile.areas] : []),
          });
        }
      } catch (error) {
        console.error('Error fetching cleaner profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const getInitials = (name: string): string => {
    if (!name) return 'SC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatExperience = (years: number): string => {
    if (years === 0) return 'New';
    if (years === 1) return '1y';
    return `${years}y`;
  };

  const formatLocation = (areas: string[]): string => {
    if (!areas || areas.length === 0) return 'Not specified';
    if (areas.length <= 2) return areas.join(', ');
    return `${areas.slice(0, 2).join(', ')}...`;
  };

  const displayName = profileData?.name || 'Shalean Cleaner';
  const initials = getInitials(displayName);
  const experience = profileData?.years_experience || 0;
  const phone = profileData?.phone || 'Not provided';
  const email = profileData?.email || 'Not provided';
  const location = formatLocation(profileData?.areas || []);
  const services = profileData?.specialties && profileData.specialties.length > 0
    ? profileData.specialties
    : ['Standard Cleaning', 'Deep Cleaning', 'Move In/Out', 'Carpet Cleaning'];

  return <div className="space-y-6 pb-24">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            {profileData?.photo_url ? (
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden">
                <img src={profileData.photo_url} alt={displayName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white shadow-xl">
                {initials}
              </div>
            )}
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Camera size={14} className="text-blue-600" />
            </button>
          </div>
          <h2 className="text-2xl font-bold">{displayName}</h2>
          <p className="text-blue-100 text-sm mt-1">Professional Cleaner</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{cleanerRating?.toFixed(1) || '0.0'}</div>
              <div className="text-xs text-blue-100">Rating</div>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalJobs || 0}</div>
              <div className="text-xs text-blue-100">Jobs Done</div>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatExperience(experience)}</div>
              <div className="text-xs text-blue-100">Experience</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Contact Information</h3>
          <button className="p-2 hover:bg-gray-50 rounded-lg">
            <Edit2 size={16} className="text-gray-400" />
          </button>
        </div>
        {isLoadingProfile ? (
          <div className="p-4 text-center text-gray-500">Loading profile...</div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Phone size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Phone</div>
                <div className="font-semibold text-gray-900">{phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Mail size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Email</div>
                <div className="font-semibold text-gray-900">{email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <MapPin size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">Location</div>
                <div className="font-semibold text-gray-900">{location}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skills & Services */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Services Offered</h3>
        </div>
        <div className="p-4">
          {isLoadingProfile ? (
            <div className="text-center text-gray-500 py-2">Loading services...</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {services.map((service, idx) => <span key={idx} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold">
                  {service}
                </span>)}
            </div>
          )}
        </div>
      </div>

      {/* Settings Actions */}
      <div className="space-y-2">
        <button className="w-full p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between text-left shadow-sm">
          <span className="font-semibold text-gray-900">Notification Settings</span>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
        <button className="w-full p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between text-left shadow-sm">
          <span className="font-semibold text-gray-900">Payment Methods</span>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
        <button className="w-full p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between text-left shadow-sm">
          <span className="font-semibold text-gray-900">Privacy & Security</span>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
        <button className="w-full p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between text-left shadow-sm">
          <span className="font-semibold text-gray-900">Help & Support</span>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
      </div>

      <button className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-semibold">
        Logout
      </button>
    </div>;
};

// Earnings Page Component
const EarningsPage = ({ earnings, monthlyEarnings, isLoading }: { earnings: EarningsRecord[]; monthlyEarnings?: number; isLoading: boolean }) => {
  // Calculate monthly earnings from transactions if not provided
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  
  const calculatedMonthlyEarnings = monthlyEarnings !== undefined 
    ? monthlyEarnings / 100 // Convert from cents if provided
    : earnings
        .filter(e => {
          // Use original booking_date if available, otherwise try to parse from formatted date
          if (e.booking_date) {
            return e.booking_date >= firstDayOfMonth;
          }
          // Fallback: if no booking_date, include all (this shouldn't happen)
          return true;
        })
        .reduce((sum, e) => sum + e.amount, 0);
  
  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const pendingEarnings = earnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const paidEarnings = earnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  
  return <div className="space-y-6 pb-24">
      {/* Earnings Overview */}
      <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-green-100 text-sm">Total Earnings</p>
            <h2 className="text-4xl font-bold mt-1">R{calculatedMonthlyEarnings.toFixed(2)}</h2>
            <p className="text-green-100 text-sm mt-2">This month</p>
          </div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <TrendingUp size={28} />
          </div>
        </div>
        <p className="text-xs text-green-100 mt-2">All time earnings: R{totalEarnings.toFixed(2)}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
            <DollarSign size={20} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">R{paidEarnings.toFixed(0)}</div>
          <div className="text-xs text-gray-500 mt-1">Paid Out</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">R{pendingEarnings.toFixed(0)}</div>
          <div className="text-xs text-gray-500 mt-1">Pending</div>
        </div>
      </div>

      {/* Earnings History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
          <button className="text-blue-600 text-sm font-semibold">View All</button>
        </div>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading earnings...</div>
        ) : earnings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No earnings found</div>
        ) : (
          <div className="space-y-3">
            {earnings.map(earning => <motion.div key={earning.id} whileTap={{
          scale: 0.98
        }} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${earning.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{earning.clientName}</h4>
                    <p className="text-xs text-gray-500">{earning.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">R{earning.amount.toFixed(2)}</div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${earning.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                  </span>
                </div>
              </div>
            </motion.div>)}
          </div>
        )}
      </div>

      {/* Payout Button */}
      <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg">
        <Wallet size={20} />
        Request Payout
      </button>
    </div>;
};

// Main Component
export const CleanerDashboard = () => {
  const [activePage, setActivePage] = useState<PageView>('Dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [cleanerRating, setCleanerRating] = useState<number>(0);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/cleaner/bookings', {
          credentials: 'include',
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.ok && data.bookings) {
          const transformedBookings = data.bookings.map((b: DatabaseBooking) => transformBooking(b, true));
          setBookings(transformedBookings);
          
          // Create schedule events from upcoming bookings
          const upcoming = data.bookings
            .filter((b: DatabaseBooking) => ['pending', 'accepted', 'on_my_way', 'in-progress'].includes(b.status))
            .map((b: DatabaseBooking) => transformScheduleEvent(b));
          setScheduleEvents(upcoming);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Fetch earnings
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const response = await fetch('/api/cleaner/payments', {
          credentials: 'include',
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.ok && data.transactions) {
          const transformedEarnings = data.transactions.map((t: DatabaseEarnings) => transformEarnings(t));
          setEarnings(transformedEarnings);
          
          // Store monthly earnings from summary if available
          if (data.summary && data.summary.monthly_earnings !== undefined) {
            setMonthlyEarnings(data.summary.monthly_earnings);
          }
        }
      } catch (error) {
        console.error('Error fetching earnings:', error);
      }
    };

    fetchEarnings();
  }, []);

  const navItems = [{
    id: 'Dashboard' as PageView,
    icon: LayoutDashboard,
    label: 'Dashboard'
  }, {
    id: 'Jobs' as PageView,
    icon: Calendar,
    label: 'Jobs'
  }, {
    id: 'Schedule' as PageView,
    icon: ClipboardList,
    label: 'Schedule'
  }, {
    id: 'Profile' as PageView,
    icon: User,
    label: 'Profile'
  }, {
    id: 'Earnings' as PageView,
    icon: Wallet,
    label: 'Earnings'
  }] as any[];

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <DashboardPage bookings={bookings} isLoading={isLoading} />;
      case 'Jobs':
        return <JobsPage bookings={bookings} isLoading={isLoading} />;
      case 'Schedule':
        return <SchedulePage scheduleEvents={scheduleEvents} isLoading={isLoading} />;
      case 'Profile':
        return <ProfilePage cleanerRating={cleanerRating} totalJobs={bookings.filter(b => b.status === 'completed').length} />;
      case 'Earnings':
        return <EarningsPage earnings={earnings} monthlyEarnings={monthlyEarnings} isLoading={isLoading} />;
      default:
        return <DashboardPage bookings={bookings} isLoading={isLoading} />;
    }
  };

  return <div className="min-h-screen bg-gray-50 font-sans">
      {/* Mobile Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{activePage}</h1>
            <p className="text-xs text-gray-500">Shalean Cleaner</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={activePage} initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} transition={{
          duration: 0.2
        }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-20">
        <div className="flex items-center justify-around">
          {navItems.map(item => <button key={item.id} onClick={() => setActivePage(item.id)} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${activePage === item.id ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
              <item.icon size={22} strokeWidth={activePage === item.id ? 2.5 : 2} />
              <span className="text-xs font-semibold">{item.label}</span>
            </button>)}
        </div>
      </nav>
    </div>;
};
