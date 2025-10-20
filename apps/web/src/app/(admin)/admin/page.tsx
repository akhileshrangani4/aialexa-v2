'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';
import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  // Fetch pending users
  const { data: pendingUsers, isLoading: usersLoading, refetch } = trpc.admin.getPendingUsers.useQuery(
    undefined,
    { enabled: !!session }
  );

  // Approve user mutation
  const approveUser = trpc.admin.approveUser.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Reject user mutation
  const rejectUser = trpc.admin.rejectUser.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleApprove = async (userId: string) => {
    if (confirm('Are you sure you want to approve this user?')) {
      await approveUser.mutateAsync({ userId });
    }
  };

  const handleReject = async (userId: string) => {
    if (confirm('Are you sure you want to reject this user? They will be notified via email.')) {
      await rejectUser.mutateAsync({ userId });
    }
  };

  // Loading state
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if user is admin
  if (!session) {
    router.push('/login');
    return null;
  }

  // Type assertion for extended user fields
  const user = session.user as typeof session.user & { role: 'user' | 'admin'; status: 'pending' | 'approved' | 'rejected' };

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don&apos;t have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage users, domains, and system settings</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button variant="outline" onClick={async () => {
              await signOut();
              router.push('/login');
            }}>Sign Out</Button>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Pending Users</TabsTrigger>
            <TabsTrigger value="domains">Approved Domains</TabsTrigger>
          </TabsList>

          {/* Pending Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Pending User Approvals</CardTitle>
                <CardDescription>Review and approve user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {approveUser.error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{approveUser.error.message}</AlertDescription>
                  </Alert>
                )}
                {rejectUser.error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{rejectUser.error.message}</AlertDescription>
                  </Alert>
                )}

                {usersLoading ? (
                  <p className="text-center py-8 text-gray-500">Loading users...</p>
                ) : !pendingUsers || pendingUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No pending users</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(user.id)}
                                disabled={approveUser.isPending || rejectUser.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(user.id)}
                                disabled={approveUser.isPending || rejectUser.isPending}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approved Domains Tab */}
          <TabsContent value="domains">
            <Card>
              <CardHeader>
                <CardTitle>Approved Email Domains</CardTitle>
                <CardDescription>
                  Email domains that are automatically approved for registration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertDescription>
                    Approved domains are configured in your environment variables (APPROVED_DOMAINS).
                    Users with these email domains can register automatically.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Configured domains will be shown here. If the list is empty, all domains are allowed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
