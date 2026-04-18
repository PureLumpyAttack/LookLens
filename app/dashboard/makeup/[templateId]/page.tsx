export default async function Page({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  return <div>ID: {templateId}</div>;
}
