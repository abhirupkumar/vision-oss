import { ErrorChart } from './_components/ErrorChart';
import { ErrorList } from './_components/ErrorList';
import { ErrorSummaryStats } from './_components/ErrorSummaryStats';

export default function ErrorsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Errors</h1>
        <p className="text-muted-foreground">Monitor and track JavaScript errors across your application.</p>
      </div>

      <ErrorSummaryStats />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        <div className="col-span-1 lg:col-span-7">
          <ErrorChart />
        </div>
      </div>

      <ErrorList />
    </div>
  );
}
