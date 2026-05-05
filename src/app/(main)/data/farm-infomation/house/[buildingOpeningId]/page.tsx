import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{
    buildingOpeningId: string;
  }>;
};

export default async function FarmInformationHouseDetailAliasRoutePage({ params }: PageProps) {
  const resolved = await params;
  redirect(`/data/farm-information/house/${resolved.buildingOpeningId}`);
}
