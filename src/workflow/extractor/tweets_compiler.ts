import { ParsedData } from '@/types';
import { Debugger } from '@/utils/debugger';

export class TweetsCompiler {
  private debug: Debugger;

  constructor() {
    this.debug = Debugger.getInstance();
  }

  run(parsedData: ParsedData) {
    let formattedText = '';

    for (const userTweets of parsedData) {
      for (const tweet of userTweets.tweets) {
        formattedText += `${userTweets.user.data.username} wrote at ${tweet.created_at} (${tweet.view_count} views)\n\n`;

        if (tweet.text.length === 1) {
          formattedText += `${tweet.text[0]}\n\n`;
        } else {
          tweet.text.forEach((text: string, index: number) => {
            formattedText += `${index + 1}. ${text}\n\n`;
          });
        }

        formattedText += '---\n\n';
      }
    }

    this.debug.verbose(formattedText);

    return formattedText;
  }
}
