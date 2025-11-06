'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Eye, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  cover_letter: string;
  work_experience: string;
  certifications: string;
  availability: string;
  reference_contacts: string;
  resume_url: string;
  transportation_details: string;
  languages_spoken: string;
  criminal_background_consent: boolean;
  status: string;
  created_at: string;
}

export function ApplicationsSection() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/applications?${params}`, {
        credentials: 'include', // Include cookies for server-side auth
      });
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch applications');
      }

      setApplications(data.applications);
      setTotalPages(data.pagination.totalPages);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, statusFilter]);

  const handleUpdateStatus = async (id: string, status: string, createCleaner: boolean = false) => {
    try {
      setProcessingId(id);
      const response = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for server-side auth
        body: JSON.stringify({ id, status, createCleaner }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to update application');
      }

      if (data.cleaner) {
        alert(`Application ${status} and cleaner profile created!`);
      }

      setProcessingId(null);
      fetchApplications();
    } catch (err) {
      console.error('Error updating application:', err);
      alert('Failed to update application');
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'interviewed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Applications Review</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="interviewed">Interviewed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No applications found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          {app.first_name} {app.last_name}
                        </TableCell>
                        <TableCell>{app.position}</TableCell>
                        <TableCell className="text-sm">
                          {app.location || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{app.email}</div>
                          <div className="text-sm text-gray-500">{app.phone}</div>
                        </TableCell>
                        <TableCell>
                          {new Date(app.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(app.status)}>
                            {app.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingApplication(app)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {app.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(app.id, 'accepted', true)}
                                  disabled={processingId === app.id}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  {processingId === app.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                  disabled={processingId === app.id}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Application Details Dialog */}
      <Dialog open={!!viewingApplication} onOpenChange={(open) => !open && setViewingApplication(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              {viewingApplication?.first_name} {viewingApplication?.last_name} - {viewingApplication?.position}
            </DialogDescription>
          </DialogHeader>
          {viewingApplication && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p>{viewingApplication.first_name} {viewingApplication.last_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Position</p>
                  <p>{viewingApplication.position}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p>{viewingApplication.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p>{viewingApplication.phone}</p>
                </div>
                {viewingApplication.location && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p>{viewingApplication.location}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Cover Letter</p>
                <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {viewingApplication.cover_letter}
                </p>
              </div>

              {viewingApplication.work_experience && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Work Experience</p>
                  <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
                    {viewingApplication.work_experience}
                  </p>
                </div>
              )}

              {viewingApplication.certifications && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Certifications</p>
                  <p className="text-sm">{viewingApplication.certifications}</p>
                </div>
              )}

              {viewingApplication.availability && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Availability</p>
                  <p className="text-sm">{viewingApplication.availability}</p>
                </div>
              )}

              {viewingApplication.transportation_details && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Transportation</p>
                  <p className="text-sm">{viewingApplication.transportation_details}</p>
                </div>
              )}

              {viewingApplication.languages_spoken && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Languages</p>
                  <p className="text-sm">{viewingApplication.languages_spoken}</p>
                </div>
              )}

              {viewingApplication.reference_contacts && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">References</p>
                  <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
                    {viewingApplication.reference_contacts}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Background Check Consent</p>
                <Badge className={viewingApplication.criminal_background_consent 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-red-100 text-red-800 border-red-200'}>
                  {viewingApplication.criminal_background_consent ? 'Provided' : 'Not Provided'}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge className={getStatusColor(viewingApplication.status)}>
                    {viewingApplication.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Applied</p>
                  <p className="text-sm">
                    {new Date(viewingApplication.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {viewingApplication?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (viewingApplication) {
                      handleUpdateStatus(viewingApplication.id, 'rejected');
                      setViewingApplication(null);
                    }
                  }}
                  className="text-red-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    if (viewingApplication) {
                      handleUpdateStatus(viewingApplication.id, 'accepted', true);
                      setViewingApplication(null);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept & Create Cleaner
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setViewingApplication(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

