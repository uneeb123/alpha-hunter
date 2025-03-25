import { MentionData } from '@/utils/elfa';

export function calculateEngagementScore(tweet: MentionData): number {
  // Avoid division by zero
  const viewCount = tweet.viewCount || 1;

  // Calculate individual engagement ratios
  const likeRatio = tweet.likeCount / viewCount;
  const quoteRatio = tweet.quoteCount / viewCount;
  const replyRatio = tweet.replyCount / viewCount;
  const repostRatio = tweet.repostCount / viewCount;
  const bookmarkRatio = (tweet.bookmarkCount || 0) / viewCount;

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
    tweet.likeCount +
    tweet.quoteCount +
    tweet.replyCount +
    tweet.repostCount +
    (tweet.bookmarkCount || 0);

  // Engagement ratio (interactions per view)
  const engagementRatio = totalInteractions / viewCount;

  // Base score considering view count (more views is better)
  const viewScore = Math.log10(viewCount + 1) * 10;

  // Engagement quality score (ratio of interactions to views)
  const engagementQualityScore = engagementRatio * 1000;

  // Combined score
  const score = viewScore + engagementQualityScore;

  return score;
}
