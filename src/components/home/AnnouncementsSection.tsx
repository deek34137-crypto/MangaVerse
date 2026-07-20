"use client";

import { motion } from "framer-motion";
import { Info, Wrench, Sparkles, Calendar } from "lucide-react";
import { Announcement } from "@/services/home/types";
import { cn, formatRelativeTime } from "@/lib/utils";

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  className?: string;
}

const typeIcons = {
  info: Info,
  maintenance: Wrench,
  feature: Sparkles,
  event: Calendar,
} as const;

const typeColors = {
  info: "bg-primary/10 text-primary border-primary/20",
  maintenance: "bg-destructive/10 text-destructive border-destructive/20",
  feature: "bg-accent/10 text-accent border-accent/20",
  event: "bg-warning/10 text-warning border-warning/20",
} as const;

export function AnnouncementsSection({ announcements, className }: AnnouncementsSectionProps) {
  if (!announcements.length) return null;

  return (
    <section className={cn("space-y-4", className)} aria-labelledby="announcements-heading">
      <h2 id="announcements-heading" className="text-heading-lg font-display font-bold text-foreground flex items-center gap-2">
        <span className="h-5 w-5 text-primary" aria-hidden="true">
          <Sparkles className="h-5 w-5" />
        </span>
        Announcements
      </h2>

      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {announcements.map((announcement, index) => {
            const IconComponent = typeIcons[announcement.type];
            return (
              <motion.article
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <div className={cn(
                  "relative rounded-xl p-4 border transition-all duration-200",
                  typeColors[announcement.type],
                  "hover:shadow-lg hover:shadow-primary/10"
                )}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          typeColors[announcement.type]
                        )}>
                          {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatRelativeTime(announcement.startsAt)}
                        </span>
                        {announcement.endsAt && (
                          <span className="flex items-center gap-1">
                            Ends: {formatRelativeTime(announcement.endsAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            );})}
        </motion.div>
      </div>
    </section>
  );
}