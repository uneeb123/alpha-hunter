import { Keypair } from '@solana/web3.js';
import { getSecrets } from './secrets';
import axios from 'axios';
import bs58 from 'bs58';
import * as ed from '@noble/ed25519';
import { createHash } from 'crypto';
import { Debugger } from './debugger';
import { TokenReport } from '@/types';

// Set up SHA-512 for ed25519
ed.etc.sha512Sync = (...m) =>
  createHash('sha512').update(Buffer.concat(m)).digest();

export class RugcheckClient {
  private static instance: RugcheckClient;
  private baseUrl = 'https://api.rugcheck.xyz';
  private jwt: string | null = null;
  private debugger: Debugger;

  private constructor() {
    this.debugger = Debugger.getInstance();
  }

  public static getInstance(): RugcheckClient {
    if (!RugcheckClient.instance) {
      RugcheckClient.instance = new RugcheckClient();
    }
    return RugcheckClient.instance;
  }

  private async getWallet(): Promise<Keypair> {
    const { adminPrivateKey } = getSecrets();
    return Keypair.fromSecretKey(bs58.decode(adminPrivateKey));
  }

  private async ensureAuth(): Promise<string> {
    if (!this.jwt) {
      this.jwt = await this.login();
    }
    return this.jwt;
  }

  public async login(): Promise<string> {
    try {
      if (this.jwt !== null) {
        return this.jwt;
      }

      const wallet = await this.getWallet();

      // Create message object with exact property order
      const messageObj = {
        message: 'Sign-in to Rugcheck.xyz',
        timestamp: Date.now(),
        publicKey: wallet.publicKey.toString(),
      };

      this.debugger.verbose('Creating message object:', messageObj);

      // Sign the exact string representation
      const messageString = JSON.stringify(messageObj);
      const messageBytes = new TextEncoder().encode(messageString);
      const signature = await ed.sign(
        messageBytes,
        wallet.secretKey.slice(0, 32),
      );
      const signatureArray = Array.from(signature);

      const params = {
        wallet: wallet.publicKey.toString(),
        signature: {
          type: 'Buffer',
          data: signatureArray,
        },
        message: messageObj,
      };

      this.debugger.verbose('Sending request with payload:', params);

      const response = await axios.post(
        `${this.baseUrl}/auth/login/solana`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data.token) {
        throw new Error('No token received from Rugcheck API');
      }

      this.jwt = response.data.token as string;
      return this.jwt;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.debugger.error('Request failed:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        });
        throw new Error(
          `Rugcheck login failed: ${JSON.stringify(error.response?.data) || error.message}`,
        );
      }
      this.debugger.error('Unexpected error:', error as Error);
      throw error;
    }
  }

  public async getTokenReport(tokenAddress: string): Promise<TokenReport> {
    try {
      const jwt = await this.ensureAuth();

      this.debugger.verbose('Fetching token report for:', tokenAddress);

      const response = await axios.get(
        `${this.baseUrl}/v1/tokens/${tokenAddress}/report`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.debugger.info('Token report received for:', tokenAddress);
      this.debugger.verbose('Token report data:', response.data);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.debugger.error('Failed to fetch token report:', {
          tokenAddress,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
        throw new Error(
          `Failed to fetch token report: ${JSON.stringify(error.response?.data) || error.message}`,
        );
      }
      this.debugger.error(
        'Unexpected error fetching token report:',
        error as Error,
      );
      throw error;
    }
  }
}
