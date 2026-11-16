import type { Metadata } from 'next';
import { MembersPage } from './MembersPage';

export default function () {
  return <MembersPage />;
}

export const metadata: Metadata = {
  title: 'Members',
};
