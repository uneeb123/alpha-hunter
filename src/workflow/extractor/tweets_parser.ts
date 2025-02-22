import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSecrets } from '@/utils/secrets';
import { TwitterResponse, Tweet, Media } from '@/types';

export type AugmentedTweet = Omit<Tweet, 'referenced_tweets'> & {
  referenced_tweets?: Array<{
    type: string;
    id: string;
    details?: Tweet;
  }>;
  media?: Media[];
};

export type TwitterConversation = {
  id: string;
  conversation: AugmentedTweet[];
};

export class TweetsParser {
  private s3Client: S3Client;

  constructor() {
    const secrets = getSecrets();
    this.s3Client = new S3Client({ region: secrets.awsRegion });
  }

  async run(filePath: string): Promise<
    {
      id: string;
      created_at: string;
      view_count: number;
      text: string[];
    }[]
  > {
    // Read tweets from S3
    const secrets = getSecrets();
    const command = new GetObjectCommand({
      Bucket: secrets.awsBucketName,
      Key: filePath,
    });

    const response = await this.s3Client.send(command);
    const fileContent = await response.Body?.transformToString();
    if (!fileContent) {
      throw new Error(`Failed to read file from S3: ${filePath}`);
    }

    const tweets = JSON.parse(fileContent) as TwitterResponse;

    // Check if there are any tweets before processing
    if (!tweets._realData.data || tweets._realData.meta.result_count === 0) {
      return [];
    }

    // Group tweets by conversation_id
    const conversations = tweets._realData.data.reduce(
      async (accPromise: Promise<TwitterConversation[]>, tweet) => {
        const acc = await accPromise;

        // Fetch detailed tweet info if media attachments are present
        const tweetData = tweet as AugmentedTweet;
        if (tweet.attachments?.media_keys) {
          // const details = await this.getTweetDetails(tweet.id);
          // tweetData = details.data;

          // Add media attachments if they exist in includes.media
          if (tweets._realData.includes.media) {
            const mediaAttachments = tweet.attachments.media_keys
              .map((key) =>
                tweets._realData.includes.media?.find(
                  (m) => m.media_key === key,
                ),
              )
              .filter((m): m is NonNullable<typeof m> => m !== undefined);

            if (mediaAttachments.length > 0) {
              tweetData.media = mediaAttachments;
            }
          }
        }

        // Augment the tweet with referenced tweet details
        const augmentedTweet: AugmentedTweet = {
          ...tweetData,
          referenced_tweets: tweetData.referenced_tweets?.map((ref) => ({
            type: ref.type,
            id: ref.id,
            details:
              ref.type === 'quoted' && tweets._realData.includes?.tweets
                ? tweets._realData.includes.tweets.find((t) => t.id === ref.id)
                : undefined,
          })),
        };

        const existingConversation = acc.find(
          (conv) => conv.id === tweet.conversation_id,
        );

        if (existingConversation) {
          existingConversation.conversation.push(augmentedTweet);
        } else {
          acc.push({
            id: tweet.conversation_id ?? tweet.id,
            conversation: [augmentedTweet],
          });
        }

        return acc;
      },
      Promise.resolve([]),
    );

    // Sort conversations to ensure proper reply chain order
    const sortedConversations = await conversations.then((convs) => {
      return convs.map((conv) => {
        // Create a map of tweet IDs to their positions for easier reference
        const tweetMap = new Map(
          conv.conversation.map((tweet, index) => [tweet.id, index]),
        );

        // Sort the conversation array
        const sortedTweets = [...conv.conversation].sort((a, b) => {
          const aIsReply = a.referenced_tweets?.some(
            (ref) => ref.type === 'replied_to',
          );
          const bIsReply = b.referenced_tweets?.some(
            (ref) => ref.type === 'replied_to',
          );

          // If a is not a reply but b is, a should come first
          if (!aIsReply && bIsReply) return -1;
          // If b is not a reply but a is, b should come first
          if (aIsReply && !bIsReply) return 1;

          // If both are replies, compare their positions based on what they're replying to
          if (aIsReply && bIsReply) {
            const aReplyToId = a.referenced_tweets?.find(
              (ref) => ref.type === 'replied_to',
            )?.id;
            const bReplyToId = b.referenced_tweets?.find(
              (ref) => ref.type === 'replied_to',
            )?.id;

            // If a is replying to b, a should come after
            if (aReplyToId === b.id) return 1;
            // If b is replying to a, b should come after
            if (bReplyToId === a.id) return -1;

            // Otherwise maintain their relative positions
            return (tweetMap.get(a.id) ?? 0) - (tweetMap.get(b.id) ?? 0);
          }

          // If neither is a reply, maintain their original order
          return (tweetMap.get(a.id) ?? 0) - (tweetMap.get(b.id) ?? 0);
        });

        return {
          ...conv,
          conversation: sortedTweets,
        };
      });
    });

    // Add filtering to transform the conversations into the desired format
    const filteredConversations = sortedConversations.map((conv) => {
      const firstTweet = conv.conversation[0];

      // Combine all texts into an array
      const tweetsArray = conv.conversation.map((tweet) => {
        let tweetText = tweet.note_tweet?.text || tweet.text;

        // Replace t.co URLs with expanded URLs if they exist
        tweet.entities?.urls?.forEach((entity) => {
          if (entity.url && entity.url.startsWith('https://t.co/')) {
            tweetText = tweetText.replace(entity.url, entity.expanded_url);
          }
        });

        // Add media URLs if exists
        if (tweet.media?.length) {
          const mediaUrls = tweet.media
            .map((m) => m.url || m.preview_image_url)
            .filter((url) => url)
            .join('\n   ');
          if (mediaUrls) {
            tweetText += `\n\nImage: ${mediaUrls}`;
          }
        }

        // Add quoted tweet text if exists
        const quotedTweet = tweet.referenced_tweets?.find(
          (t) => t.type === 'quoted',
        )?.details;
        if (quotedTweet) {
          // Find the author of the quoted tweet
          const quotedAuthor = tweets._realData.includes?.users?.find(
            (u) => u.id === quotedTweet.author_id,
          );
          const authorUsername = quotedAuthor
            ? `@${quotedAuthor.username}`
            : 'unknown user';

          // Replace t.co URLs with expanded URLs in quoted tweet text
          let quotedText = quotedTweet.text;
          quotedTweet.entities?.urls?.forEach((entity) => {
            if (entity.url && entity.url.startsWith('https://t.co/')) {
              quotedText = quotedText.replace(entity.url, entity.expanded_url);
            }
          });

          tweetText += `\n\nQuoted from ${authorUsername}: "${quotedText}"`;
        }

        return tweetText;
      });

      return {
        id: conv.id,
        created_at: firstTweet.created_at ?? new Date().toISOString(),
        view_count: firstTweet.public_metrics?.impression_count || 0,
        text: tweetsArray,
      };
    });

    return filteredConversations;
  }
}
