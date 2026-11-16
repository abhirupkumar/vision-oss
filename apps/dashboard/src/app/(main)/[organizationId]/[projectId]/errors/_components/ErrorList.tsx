'use client';

import { useState } from 'react';
import { useProjectErrorsQuery, useProject, useResolveErrorMutation } from '@/components/hooks';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecentError } from './types';
import { getErrorCategory, getSeverityColor } from './utils';

export function ErrorList() {
  const { projectId } = useProject();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useProjectErrorsQuery(projectId, { page, pageSize: 20 });
  const resolveMutation = useResolveErrorMutation();

  const handleResolve = async (fingerprint: string) => {
    await resolveMutation.mutateAsync({ projectId, fingerprint });
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Errors</CardTitle>
      </CardHeader>
      <CardContent>
        <LoadingPanel isLoading={isLoading} error={error} minHeight="300px">
          <div className="space-y-4">
            {data?.data?.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                No recent errors found.
              </div>
            ) : (
              data?.data?.map((err: RecentError) => {
                const category = getErrorCategory(err.message, err.error_type);
                
                return (
                  <div key={err.id} className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Badge className={`${getSeverityColor(err.level)} text-white mt-1`}>
                          {err.level.toUpperCase()}
                        </Badge>
                        <div>
                          <h3 className="font-semibold text-lg">{err.error_type || 'Error'}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{err.message}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleResolve(err.fingerprint)}>
                        Mark Resolved
                      </Button>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <div className="bg-muted px-2 py-1 rounded">
                        <span className="font-semibold">URL:</span> {err.url_path || '/'}
                      </div>
                      {err.browser && (
                        <div className="bg-muted px-2 py-1 rounded">
                          <span className="font-semibold">Browser:</span> {err.browser}
                        </div>
                      )}
                      {err.os && (
                        <div className="bg-muted px-2 py-1 rounded">
                          <span className="font-semibold">OS:</span> {err.os}
                        </div>
                      )}
                      <div className="bg-muted px-2 py-1 rounded">
                        <span className="font-semibold">Date:</span> {new Date(err.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    {err.stack && (
                      <div className="mt-2 rounded-md bg-secondary/50 p-2 overflow-x-auto">
                        <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap">{err.stack}</pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {data?.count > 0 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.count)} of {data.count}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page * 20 >= data.count}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </LoadingPanel>
      </CardContent>
    </Card>
  );
}
