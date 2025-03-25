import { MentionData } from '@/utils/elfa';

export function calculateEngagementScore({
  likeCount,
  quoteCount,
  replyCount,
  repostCount,
  bookmarkCount = 0,
  viewCount = 1,
}: {
  likeCount: number;
  quoteCount: number;
  replyCount: number;
  repostCount: number;
  bookmarkCount?: number;
  viewCount?: number;
}): number {
  // Avoid division by zero
  const safeViewCount = viewCount || 1;

  // Calculate individual engagement ratios
  const likeRatio = likeCount / safeViewCount;
  const quoteRatio = quoteCount / safeViewCount;
  const replyRatio = replyCount / safeViewCount;
  const repostRatio = repostCount / safeViewCount;
  const bookmarkRatio = bookmarkCount / safeViewCount;

  // Define minimum thresholds based on real data analysis
  // These represent the lower bounds of normal engagement - being conservative
  const MIN_LIKE_RATIO = 0.001; // At least 0.1% of viewers liked
  const MIN_QUOTE_RATIO = 0.00005; // At least 0.005% of viewers quoted
  const MIN_REPLY_RATIO = 0.00005; // At least 0.005% of viewers replied
  const MIN_REPOST_RATIO = 0.00005; // At least 0.005% of viewers reposted
  const MIN_BOOKMARK_RATIO = 0.00001; // At least 0.001% of viewers bookmarked

  // Sanity check - if any ratio is abnormally low, return 0
  if (
    likeRatio < MIN_LIKE_RATIO ||
    quoteRatio < MIN_QUOTE_RATIO ||
    replyRatio < MIN_REPLY_RATIO ||
    repostRatio < MIN_REPOST_RATIO ||
    bookmarkRatio < MIN_BOOKMARK_RATIO
  ) {
    return 0;
  }

  // Basic engagement metrics
  const totalInteractions =
    likeCount + quoteCount + replyCount + repostCount + bookmarkCount;

  // Engagement ratio (interactions per view)
  const engagementRatio = totalInteractions / safeViewCount;

  // Base score considering view count (more views is better)
  const viewScore = Math.log10(safeViewCount + 1) * 10;

  // Engagement quality score (ratio of interactions to views)
  const engagementQualityScore = engagementRatio * 1000;

  // Combined score
  const score = viewScore + engagementQualityScore;

  return score;
}

export function calculateEngagementScoreWithoutBookmarks({
  likeCount,
  replyCount,
  repostCount,
  viewCount = 1,
}: {
  likeCount: number;
  replyCount: number;
  repostCount: number;
  viewCount?: number;
}): number {
  // Avoid division by zero
  const safeViewCount = viewCount || 1;

  // Calculate individual engagement ratios
  const likeRatio = likeCount / safeViewCount;
  const replyRatio = replyCount / safeViewCount;
  const repostRatio = repostCount / safeViewCount;

  // Define minimum thresholds based on real data analysis
  // These represent the lower bounds of normal engagement - being conservative
  const MIN_LIKE_RATIO = 0.001; // At least 0.1% of viewers liked
  const MIN_REPLY_RATIO = 0.00005; // At least 0.005% of viewers replied
  const MIN_REPOST_RATIO = 0.00005; // At least 0.005% of viewers reposted

  // Sanity check - if any ratio is abnormally low, return 0
  if (
    likeRatio < MIN_LIKE_RATIO ||
    replyRatio < MIN_REPLY_RATIO ||
    repostRatio < MIN_REPOST_RATIO
  ) {
    return 0;
  }

  // Basic engagement metrics
  const totalInteractions = likeCount + replyCount + repostCount;

  // Engagement ratio (interactions per view)
  const engagementRatio = totalInteractions / safeViewCount;

  // Base score considering view count (more views is better)
  const viewScore = Math.log10(safeViewCount + 1) * 10;

  // Engagement quality score (ratio of interactions to views)
  const engagementQualityScore = engagementRatio * 1000;

  // Combined score
  const score = viewScore + engagementQualityScore;

  return score;
}

// For backward compatibility
export function calculateEngagementScoreFromTweet(tweet: MentionData): number {
  return calculateEngagementScore({
    likeCount: tweet.likeCount,
    quoteCount: tweet.quoteCount,
    replyCount: tweet.replyCount,
    repostCount: tweet.repostCount,
    bookmarkCount: tweet.bookmarkCount || 0,
    viewCount: tweet.viewCount || 1,
  });
}
