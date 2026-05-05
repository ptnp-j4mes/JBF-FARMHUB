import FarmHouseDetailPage from '@/features/data/farm-information/FarmHouseDetailPage';

type PageProps = {
  params: Promise<{
    buildingOpeningId: string;
  }>;
};

export default async function FarmInformationHouseDetailRoutePage({ params }: PageProps) {
  const resolved = await params;
  return <FarmHouseDetailPage buildingOpeningId={Number(resolved.buildingOpeningId)} />;
}
