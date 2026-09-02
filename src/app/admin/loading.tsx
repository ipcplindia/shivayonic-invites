import { Card, PageHeader, Skeleton } from "@/components/ui";

export default function AdminLoading() {
  return (
    <>
      <PageHeader title="Loading Command Center" lede="Preparing the current organization workspace." />
      <Card>
        <Skeleton width="38%" height={18} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="82%" height={14} />
      </Card>
    </>
  );
}
