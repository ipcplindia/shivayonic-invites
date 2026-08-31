import type { Metadata } from "next";
import { redirect } from "next/navigation";

import styles from "@/app/admin/admin.module.css";
import { getCurrentUserContext } from "@/auth/context";
import { Icon, type IconName } from "@/components/icon";
import { Card, CardHeader, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { can } from "@/features/access";
import { publicationPlatforms, type PublicationPlatform } from "@/shared/domain";

export const metadata: Metadata = { title: "Publish" };

const channelCopy: Record<PublicationPlatform, { name: string; icon: IconName; body: string }> = {
  WEBSITE: {
    name: "Shivayonic.com",
    icon: "publish",
    body: "Publishes a finished master to the public invitation page, with its poster frame and credits.",
  },
  YOUTUBE: {
    name: "YouTube",
    icon: "video",
    body: "Uploads the film master and its metadata to the studio channel.",
  },
  INSTAGRAM: {
    name: "Instagram",
    icon: "image",
    body: "Delivers the cut-down and its caption to the studio account.",
  },
};

export default async function PublishPage() {
  const context = await getCurrentUserContext();
  if (!can(context, "PROJECT_WRITE")) redirect("/admin");

  return (
    <>
      <PageHeader
        title="Publish"
        lede="Send one finished master out to every channel it belongs on. Nothing is published from here yet — the provider integrations are still being built."
      />

      <section aria-label="Channels">
        <div className={styles.channelGrid}>
          {publicationPlatforms.map((platform) => {
            const channel = channelCopy[platform];
            return (
              <article key={platform} className={styles.channel}>
                <div className={styles.channelTop}>
                  <Icon name={channel.icon} size={20} />
                  <StatusBadge label="Not connected" tone="neutral" shape="square" />
                </div>
                <h3 className={styles.channelName}>{channel.name}</h3>
                <p className={styles.channelBody}>{channel.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader
          title="Publication queue"
          description="Deliveries in flight, with their per-channel result."
        />
        <EmptyState
          icon="publish"
          title="Publishing providers will appear here as integrations become available"
          body="When a channel is connected, selecting a master will queue one publication per channel and report each result separately, including retries."
        />
      </Card>
    </>
  );
}
