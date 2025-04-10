import axios from 'axios';
import { getSecrets } from '@/utils/secrets';
import {
  BitQueryResponse,
  PumpSwapPoolsResponse,
  PumpSwapPool,
  GraduatedToken,
} from '@/types';

type BitQueryVariables = {
  limit?: number;
  network?: string;
  address?: string;
  method?: string;
  timestamp?: {
    gt?: string;
    lt?: string;
  };
  [key: string]: unknown;
};

export class BitQueryClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;

  constructor() {
    const { bitqueryAccessToken } = getSecrets();
    this.accessToken = bitqueryAccessToken;
    this.baseUrl = 'https://streaming.bitquery.io/eap';
  }

  async query<T>(
    query: string,
    variables?: BitQueryVariables,
  ): Promise<BitQueryResponse<T>> {
    try {
      const response = await axios.post<BitQueryResponse<T>>(
        this.baseUrl,
        {
          query,
          variables,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `BitQuery API Error: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  async getRecentlyGraduatedToken(
    limit: number = 10,
  ): Promise<GraduatedToken[]> {
    const pools = await this.getRecentPumpSwapPools(limit);
    const graduatedTokens: GraduatedToken[] = [];

    pools.forEach((pool) => {
      const { Transaction, Instruction, Block } = pool;
      const WSOL = 'So11111111111111111111111111111111111111112';

      const uniqueTokenMints = [
        ...new Set(
          Instruction.Accounts.filter(
            (acc) => acc.Token?.Mint && acc.Token.Mint !== WSOL,
          ).map((acc) => acc.Token!.Mint),
        ),
      ];

      const pumpToken = uniqueTokenMints.find((mint) =>
        mint!.toLowerCase().endsWith('pump'),
      );
      const lpToken = uniqueTokenMints.find((mint) => mint !== pumpToken);

      if (pumpToken && lpToken && uniqueTokenMints.length === 2) {
        graduatedTokens.push({
          creator: Transaction.Signer,
          success: Transaction.Result.Success,
          pump_token: pumpToken,
          lp_token: lpToken,
          creation_time: Block.Time,
        });
      }
    });

    return graduatedTokens;
  }

  // Get recently created pools on PumpSwap
  async getRecentPumpSwapPools(limit: number = 10): Promise<PumpSwapPool[]> {
    const query = `query {
  Solana {
    Instructions(
      where: {
        Instruction: {
          CallerIndex: { eq: 2 }
          Depth: { eq: 1 }
          CallPath: { includes: { eq: 2 } }
          Program: {
            Method: { is: "create_pool" }
            Address: { is: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA" }
          }
        }
      }
      limit: { count: ${limit} }
      orderBy: { descending: Block_Time }
    ) {
      Instruction {
        Program {
          Address
          Name
          Method
          Arguments {
            Name
            Type
            Value {
              ... on Solana_ABI_Json_Value_Arg {
                json
              }
              ... on Solana_ABI_Float_Value_Arg {
                float
              }
              ... on Solana_ABI_Boolean_Value_Arg {
                bool
              }
              ... on Solana_ABI_Bytes_Value_Arg {
                hex
              }
              ... on Solana_ABI_BigInt_Value_Arg {
                bigInteger
              }
              ... on Solana_ABI_Address_Value_Arg {
                address
              }
              ... on Solana_ABI_String_Value_Arg {
                string
              }
              ... on Solana_ABI_Integer_Value_Arg {
                integer
              }
            }
          }
          AccountNames
          Json
        }
        Accounts {
          Address
          IsWritable
          Token {
            Mint
            Owner
            ProgramId
          }
        }
        Logs
        BalanceUpdatesCount
        AncestorIndexes
        CallPath
        CallerIndex
        Data
        Depth
        ExternalSeqNumber
        Index
        InternalSeqNumber
        TokenBalanceUpdatesCount
      }
      Transaction {
        Fee
        FeeInUSD
        Signature
        Signer
        FeePayer
        Result {
          Success
          ErrorMessage
        }
      }
      Block {
        Time
        Height
      }
    }
  }
}`;

    const response = await this.query<PumpSwapPoolsResponse>(query);

    if (response.errors) {
      throw new Error(
        `BitQuery API Error: ${response.errors.map((e) => e.message).join(', ')}`,
      );
    }

    return response.data.Solana.Instructions;
  }
}
