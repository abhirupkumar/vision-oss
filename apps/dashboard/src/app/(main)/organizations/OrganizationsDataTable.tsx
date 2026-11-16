import { DataGrid } from '@/components/common/DataGrid';
import { useLoginQuery, useNavigation, useUserOrganizationsQuery } from '@/components/hooks';
import { OrganizationsTable } from './OrganizationsTable';

export function OrganizationsDataTable() {
  const { user } = useLoginQuery();
  const query = useUserOrganizationsQuery(user.id);
  const { pathname } = useNavigation();
  const isSettings = pathname.includes('/settings');

  const renderLink = (row: any) => {
    return (
      <a
        key={row.id}
        href={isSettings ? `/settings/organizations/${row.id}` : `/${row.slug || row.id}/projects`}
      >
        {row.name}
      </a>
    );
  };

  return (
    <DataGrid query={query}>
      {({ data }) => {
        return <OrganizationsTable data={data} renderLink={renderLink} />;
      }}
    </DataGrid>
  );
}
