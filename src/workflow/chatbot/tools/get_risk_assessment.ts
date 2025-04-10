import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { RugcheckClient } from '@/utils/rugcheck_client';
import { Debugger } from '@/utils/debugger';

interface RiskAssessment {
  tokenName: string;
  tokenSymbol: string;
  overallScore: number;
  normalizedScore: number;
  risks: {
    name: string;
    description: string;
    score: number;
    level: string;
  }[];
  isRugged: boolean;
  totalHolders: number;
  totalLiquidity: number;
}

export const getRiskAssessment = tool(
  async ({ tokenAddress }: { tokenAddress: string }): Promise<string> => {
    const logger = Debugger.getInstance();
    try {
      logger.info('Fetching risk assessment for token:', tokenAddress);

      const rugcheck = RugcheckClient.getInstance();
      const report = await rugcheck.getTokenReport(tokenAddress);

      const assessment: RiskAssessment = {
        tokenName: report.tokenMeta.name,
        tokenSymbol: report.tokenMeta.symbol,
        overallScore: report.score,
        normalizedScore: report.score_normalised,
        risks: report.risks,
        isRugged: report.rugged,
        totalHolders: report.totalHolders,
        totalLiquidity: report.totalMarketLiquidity,
      };

      logger.verbose('Risk assessment data:', assessment);

      // Format the response
      let response = `Risk Assessment for ${assessment.tokenName} (${assessment.tokenSymbol})\n\n`;
      response += `Overall Risk Score: ${assessment.overallScore} (Normalized: ${assessment.normalizedScore}/100)\n`;
      response += `Status: ${assessment.isRugged ? '⚠️ RUGGED' : '✅ Not Rugged'}\n`;
      response += `Total Holders: ${assessment.totalHolders}\n`;
      response += `Total Liquidity: $${assessment.totalLiquidity.toFixed(2)}\n\n`;

      if (assessment.risks.length > 0) {
        response += 'Identified Risks:\n';
        assessment.risks.forEach((risk) => {
          const riskLevel = risk.level === 'warn' ? '⚠️' : '❌';
          response += `${riskLevel} ${risk.name}\n`;
          response += `   Score: ${risk.score}\n`;
          if (risk.description) {
            response += `   Details: ${risk.description}\n`;
          }
          response += '\n';
        });
      } else {
        response += 'No specific risks identified.\n';
      }

      return response;
    } catch (error) {
      logger.error(
        'Error in getRiskAssessment:',
        error instanceof Error ? error.message : String(error),
      );
      return `Sorry, had trouble fetching risk assessment for token ${tokenAddress}. Error: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  },
  {
    name: 'get_risk_assessment',
    description:
      'Get a detailed risk assessment for a specific token on Solana',
    schema: z.object({
      tokenAddress: z.string().describe('The token address (mint) to analyze'),
    }),
  },
);
